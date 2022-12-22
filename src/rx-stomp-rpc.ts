import { filter, first, Observable, Observer, Subscription } from 'rxjs';

import { v4 as uuid } from 'uuid';

import { IMessage, IPublishParams, StompHeaders } from '@stomp/stompjs';

import { RxStomp } from './rx-stomp.js';
import {
  RxStompRPCConfig,
  setupReplyQueueFnType,
} from './rx-stomp-rpc-config.js';

/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
export class RxStompRPC {
  private _replyQueueName = '/temp-queue/rpc-replies';

  private _setupReplyQueue: setupReplyQueueFnType = () => {
    return this.rxStomp.unhandledMessage$;
  };

  private _repliesObservable: Observable<IMessage>;

  private _customReplyQueue: boolean = false;

  // This is used to ensure that underlying subscription remains subscribed
  private _dummySubscription: Subscription;

  /**
   * Create an instance, see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
   */
  constructor(
    private rxStomp: RxStomp,
    private stompRPCConfig?: RxStompRPCConfig
  ) {
    if (stompRPCConfig) {
      if (stompRPCConfig.replyQueueName) {
        this._replyQueueName = stompRPCConfig.replyQueueName;
      }
      if (stompRPCConfig.setupReplyQueue) {
        this._customReplyQueue = true;
        this._setupReplyQueue = stompRPCConfig.setupReplyQueue;
      }
    }
  }

  /**
   * Make an RPC request.
   * See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for example.
   *
   * It is a simple wrapper around [RxStompRPC#stream]{@link RxStompRPC#stream}.
   */
  public rpc(params: IPublishParams): Observable<IMessage> {
    // We know there will be only one message in reply
    return this.stream(params).pipe(first());
  }

  /**
   * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
   *
   * Note: This call internally takes care of generating a correlation id,
   * however, if `correlation-id` is passed via `headers`, that will be used instead.
   */
  public stream(params: IPublishParams): Observable<IMessage> {
    // defensively copy
    const headers: StompHeaders = { ...(params.headers || {}) };

    if (!this._repliesObservable) {
      const repliesObservable = this._setupReplyQueue(
        this._replyQueueName,
        this.rxStomp
      );

      // In case of custom queue, ensure it remains subscribed
      if (this._customReplyQueue) {
        this._dummySubscription = repliesObservable.subscribe(() => {});
      }

      this._repliesObservable = repliesObservable;
    }

    return Observable.create((rpcObserver: Observer<IMessage>) => {
      let defaultMessagesSubscription: Subscription;

      const correlationId = headers['correlation-id'] || uuid();

      defaultMessagesSubscription = this._repliesObservable
        .pipe(
          filter((message: IMessage) => {
            return message.headers['correlation-id'] === correlationId;
          })
        )
        .subscribe((message: IMessage) => {
          rpcObserver.next(message);
        });

      // send an RPC request
      headers['reply-to'] = this._replyQueueName;
      headers['correlation-id'] = correlationId;

      this.rxStomp.publish({ ...params, headers });

      return () => {
        // Cleanup
        defaultMessagesSubscription.unsubscribe();
      };
    });
  }
}
