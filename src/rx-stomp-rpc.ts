import { Observable, Observer, Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { UUID } from 'angular2-uuid';

import {Message, publishParams, StompHeaders} from '@stomp/stompjs';

import { RxStomp } from './rx-stomp';
import { RxStompRPCConfig, setupReplyQueueFnType } from './rx-stomp-rpc-config';

/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
 */
export class RxStompRPC {
  private _replyQueueName = '/temp-queue/rpc-replies';

  private _setupReplyQueue: setupReplyQueueFnType = () => {
    return this.rxStomp.unhandledMessage$;
  }

  private _repliesObservable: Observable<Message>;

  /**
   * Create an instance, see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
   */
  constructor(private rxStomp: RxStomp, private stompRPCConfig?: RxStompRPCConfig) {
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
   * Make an RPC request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html) for example.
   */
  public rpc(params: publishParams): Observable<Message> {
    // We know there will be only one message in reply
    return this.stream(params).pipe(first());
  }

  /**
   * Make an RPC stream request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html).
   */
  public stream(params: publishParams): Observable<Message> {
    const headers: StompHeaders = (Object as any).assign({}, params.headers || {});
    const {destination, body, binaryBody} = params;

    if (!this._repliesObservable) {
      this._repliesObservable = this._setupReplyQueue(this._replyQueueName, this.rxStomp);
    }

    return Observable.create(
      (rpcObserver: Observer<Message>) => {
        let defaultMessagesSubscription: Subscription;

        const correlationId = UUID.UUID();

        defaultMessagesSubscription = this._repliesObservable.pipe(filter((message: Message) => {
          return message.headers['correlation-id'] === correlationId;
        })).subscribe((message: Message) => {
          rpcObserver.next(message);
        });

        // send an RPC request
        headers['reply-to'] = this._replyQueueName;
        headers['correlation-id'] = correlationId;

        this.rxStomp.publish({destination, body, binaryBody, headers});

        return () => { // Cleanup
          defaultMessagesSubscription.unsubscribe();
        };
      }
    );
  }
}
