"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var angular2_uuid_1 = require("angular2-uuid");
/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](/guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
var RxStompRPC = /** @class */ (function () {
    /**
     * Create an instance, see the [guide](/guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html) for details.
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
     * Make an RPC request.
     * See the [guide](/guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html) for example.
     *
     * It is a simple wrapper around [RxStompRPC#stream]{@link RxStompRPC#stream}.
     */
    RxStompRPC.prototype.rpc = function (params) {
        // We know there will be only one message in reply
        return this.stream(params).pipe(operators_1.first());
    };
    /**
     * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html).
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
        return rxjs_1.Observable.create(function (rpcObserver) {
            var defaultMessagesSubscription;
            var correlationId = headers['correlation-id'] || angular2_uuid_1.UUID.UUID();
            defaultMessagesSubscription = _this._repliesObservable.pipe(operators_1.filter(function (message) {
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
exports.RxStompRPC = RxStompRPC;
//# sourceMappingURL=rx-stomp-rpc.js.map