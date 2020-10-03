import { Observable, Observer, Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { UUID } from 'angular2-uuid';

import { IMessage, publishParams, StompHeaders } from '@stomp/stompjs';

import { RxStomp } from './rx-stomp';
import { RxStompRPCConfig, setupReplyQueueFnType } from './rx-stomp-rpc-config';

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
  public rpc(params: publishParams): Observable<IMessage> {
    // We know there will be only one message in reply
    return this.stream(params).pipe(first());
  }

  /**
   * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
   *
   * Note: This call internally takes care of generating a correlation id,
   * however, if `correlation-id` is passed via `headers`, that will be used instead.
   */
  public stream(params: publishParams): Observable<IMessage> {
    const headers: StompHeaders = (Object as any).assign(
      {},
      params.headers || {}
    );
    const { destination, body, binaryBody } = params;

    if (!this._repliesObservable) {
      this._repliesObservable = this._setupReplyQueue(
        this._replyQueueName,
        this.rxStomp
      );
    }

    return Observable.create((rpcObserver: Observer<IMessage>) => {
      let defaultMessagesSubscription: Subscription;

      const correlationId = headers['correlation-id'] || UUID.UUID();

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

      this.rxStomp.publish({ destination, body, binaryBody, headers });

      return () => {
        // Cleanup
        defaultMessagesSubscription.unsubscribe();
      };
    });
  }
}
