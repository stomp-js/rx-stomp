import { filter, first, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
/**
 * Remote Procedure Call (RPC) helper over STOMP.
 *
 * RxStompRPC implements a simple request/reply pattern using STOMP frames:
 * - Requests are published to a destination you control.
 * - A reply destination is advertised via the `reply-to` header.
 * - Responses are matched back to the request using a `correlation-id` header.
 *
 * Usage summary
 * - Use `rpc(...)` when you expect exactly one reply; it completes after the first matching message.
 * - Use `stream(...)` when the server may send multiple messages (e.g., progress updates).
 * - If you provide a `correlation-id` in `params.headers`, it will be used; otherwise a UUID is generated.
 * - The `reply-to` header is set automatically to `replyQueueName` (default `/temp-queue/rpc-replies`).
 *
 * Reply queue strategy
 * - By default, replies are read from `rxStomp.unhandledMessage$`, which is suitable when the broker
 *   routes temporary-queue replies without an explicit subscription.
 * - To subscribe to a dedicated queue or customize the reply stream, provide `{ setupReplyQueue }`
 *   via {@link RxStompRPCConfig}. RxStompRPC will keep your observable “hot” internally.
 *
 * See the guide for end-to-end examples:
 * /guide/rx-stomp/ng2-stompjs/remote-procedure-call.html
 *
 * Part of `@stomp/rx-stomp`
 */
export class RxStompRPC {
    /**
     * Construct a new RxStompRPC.
     *
     * @param rxStomp The active {@link RxStomp} instance to use for publishing and receiving.
     * @param stompRPCConfig Optional hooks to customize reply queue name and setup.
     *
     * Notes
     * - If `replyQueueName` is provided, it is used in the `reply-to` header for all requests.
     * - If `setupReplyQueue` is provided, it must return a hot Observable of all reply messages.
     *   RxStompRPC will subscribe internally to keep it alive across consumers.
     *
     * See the guide for broker-specific considerations.
     */
    constructor(rxStomp, stompRPCConfig) {
        this.rxStomp = rxStomp;
        this.stompRPCConfig = stompRPCConfig;
        /**
         * Destination used in the `reply-to` header for all RPC calls.
         * You can override it through {@link RxStompRPCConfig.replyQueueName}.
         */
        this._replyQueueName = '/temp-queue/rpc-replies';
        /**
         * Factory that returns a hot Observable delivering all reply messages.
         * Defaults to a function that uses `rxStomp.unhandledMessage$`.
         * Override via {@link RxStompRPCConfig.setupReplyQueue}.
         */
        this._setupReplyQueue = () => {
            return this.rxStomp.unhandledMessage$;
        };
        /**
         * True when a custom reply queue setup function is supplied.
         * In that case, this class keeps a dummy subscription to prevent accidental teardown.
         */
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
     * Perform a unary RPC request that resolves with the first matching reply.
     *
     * Behavior
     * - Sends a single request using {@link stream} and returns an Observable that emits the first
     *   reply whose `correlation-id` matches the request.
     * - The returned Observable completes after emitting the first message.
     *
     * Use {@link stream} if you expect multiple replies for a single request.
     */
    rpc(params) {
        // We know there will be only one message in reply
        return this.stream(params).pipe(first());
    }
    /**
     * Perform an RPC request and receive a stream of matching replies.
     *
     * How it matches replies
     * - A `correlation-id` is attached to the request and used to filter messages
     *   from the reply stream. If you pass `headers['correlation-id']`, it is preserved;
     *   otherwise, a UUID is generated.
     *
     * Headers set by RxStompRPC
     * - `reply-to`: set to {@link _replyQueueName}.
     * - `correlation-id`: set or preserved as described above.
     *
     * Observability
     * - The returned Observable is cold with respect to the request; the request is sent
     *   upon subscription, and the filtered replies are forwarded to the subscriber.
     * - Unsubscribe to stop receiving further replies for the request; the underlying
     *   reply-queue subscription remains active and shared.
     *
     * When to use
     * - Use this when the server responds with multiple messages (progress events, partials).
     * - Prefer {@link rpc} if exactly one reply is expected.
     */
    stream(params) {
        // defensively copy
        const headers = { ...(params.headers || {}) };
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
            const correlationId = headers['correlation-id'] || uuid();
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
            this.rxStomp.publish({ ...params, headers });
            return () => {
                // Cleanup: stop forwarding matching replies to this observer
                defaultMessagesSubscription.unsubscribe();
            };
        });
    }
}
//# sourceMappingURL=rx-stomp-rpc.js.map