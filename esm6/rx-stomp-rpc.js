import { Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { UUID } from 'angular2-uuid';
/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
var RxStompRPC = /** @class */ (function () {
    /**
     * Create an instance, see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
     */
    function RxStompRPC(rxStomp, stompRPCConfig) {
        var _this = this;
        this.rxStomp = rxStomp;
        this.stompRPCConfig = stompRPCConfig;
        this._replyQueueName = '/temp-queue/rpc-replies';
        this._setupReplyQueue = function () {
            return _this.rxStomp.unhandledMessage$;
        };
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
     *
     * It is a simple wrapper around [RxStompRPC#stream]{@link RxStompRPC#stream}.
     */
    RxStompRPC.prototype.rpc = function (params) {
        // We know there will be only one message in reply
        return this.stream(params).pipe(first());
    };
    /**
     * Make an RPC stream request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html).
     *
     * Note: This call internally takes care of generating a correlation id,
     * however, if `correlation-id` is passed via `headers`, that will be used instead.
     */
    RxStompRPC.prototype.stream = function (params) {
        var _this = this;
        var headers = Object.assign({}, params.headers || {});
        var destination = params.destination, body = params.body, binaryBody = params.binaryBody;
        if (!this._repliesObservable) {
            this._repliesObservable = this._setupReplyQueue(this._replyQueueName, this.rxStomp);
        }
        return Observable.create(function (rpcObserver) {
            var defaultMessagesSubscription;
            var correlationId = headers['correlation-id'] || UUID.UUID();
            defaultMessagesSubscription = _this._repliesObservable.pipe(filter(function (message) {
                return message.headers['correlation-id'] === correlationId;
            })).subscribe(function (message) {
                rpcObserver.next(message);
            });
            // send an RPC request
            headers['reply-to'] = _this._replyQueueName;
            headers['correlation-id'] = correlationId;
            _this.rxStomp.publish({ destination: destination, body: body, binaryBody: binaryBody, headers: headers });
            return function () {
                defaultMessagesSubscription.unsubscribe();
            };
        });
    };
    return RxStompRPC;
}());
export { RxStompRPC };
//# sourceMappingURL=rx-stomp-rpc.js.map