import { Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { UUID } from 'angular2-uuid';
/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
export class RxStompRPC {
    /**
     * Create an instance, see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
     */
    constructor(rxStomp, stompRPCConfig) {
        this.rxStomp = rxStomp;
        this.stompRPCConfig = stompRPCConfig;
        this._replyQueueName = '/temp-queue/rpc-replies';
        this._setupReplyQueue = () => {
            return this.rxStomp.unhandledMessage$;
        };
        this._customReplyQueue = false;
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
    rpc(params) {
        // We know there will be only one message in reply
        return this.stream(params).pipe(first());
    }
    /**
     * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
     *
     * Note: This call internally takes care of generating a correlation id,
     * however, if `correlation-id` is passed via `headers`, that will be used instead.
     */
    stream(params) {
        // defensively copy
        const headers = Object.assign({}, (params.headers || {}));
        if (!this._repliesObservable) {
            const repliesObservable = this._setupReplyQueue(this._replyQueueName, this.rxStomp);
            // In case of custom queue, ensure it remains subscribed
            if (this._customReplyQueue) {
                this._dummySubscription = repliesObservable.subscribe(() => { });
            }
            this._repliesObservable = repliesObservable;
        }
        return Observable.create((rpcObserver) => {
            let defaultMessagesSubscription;
            const correlationId = headers['correlation-id'] || UUID.UUID();
            defaultMessagesSubscription = this._repliesObservable
                .pipe(filter((message) => {
                return message.headers['correlation-id'] === correlationId;
            }))
                .subscribe((message) => {
                rpcObserver.next(message);
            });
            // send an RPC request
            headers['reply-to'] = this._replyQueueName;
            headers['correlation-id'] = correlationId;
            this.rxStomp.publish(Object.assign(Object.assign({}, params), { headers }));
            return () => {
                // Cleanup
                defaultMessagesSubscription.unsubscribe();
            };
        });
    }
}
//# sourceMappingURL=rx-stomp-rpc.js.map