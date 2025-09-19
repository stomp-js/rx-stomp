(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('rxjs'), require('@stomp/stompjs'), require('uuid')) :
    typeof define === 'function' && define.amd ? define(['exports', 'rxjs', '@stomp/stompjs', 'uuid'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.RxStomp = {}, global.rxjs, global.StompJs, global.uuid));
})(this, (function (exports, rxjs, stompjs, uuid) { 'use strict';

    /**
     * Represents a configuration object for RxSTOMP.
     * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
     *
     * All the attributes of these calls are optional.
     *
     * Part of `@stomp/rx-stomp`
     */
    class RxStompConfig {
    }

    /**
     * Connection lifecycle states for RxStomp.
     *
     * These states reflect the status of the underlying STOMP-over-WebSocket connection
     * as well as the client's activation/deactivation lifecycle.
     *
     * Common usage:
     * ```typescript
     * rxStomp.connectionState$.subscribe((state) => {
     *   switch (state) {
     *     case RxStompState.CONNECTING:
     *       console.log('Attempting to connect...');
     *       break;
     *     case RxStompState.OPEN:
     *       console.log('Connected');
     *       break;
     *     case RxStompState.CLOSING:
     *       console.log('Disconnecting...');
     *       break;
     *     case RxStompState.CLOSED:
     *       console.log('Disconnected');
     *       break;
     *   }
     * });
     * ```
     *
     * Part of `@stomp/rx-stomp`
     */
    exports.RxStompState = void 0;
    (function (RxStompState) {
        /**
         * A connection attempt is in progress. This includes the WebSocket opening
         * and the STOMP CONNECT handshake phase.
         */
        RxStompState[RxStompState["CONNECTING"] = 0] = "CONNECTING";
        /**
         * The STOMP session is fully established and operational.
         * Messages can be published, and subscriptions will receive messages.
         */
        RxStompState[RxStompState["OPEN"] = 1] = "OPEN";
        /**
         * A graceful shutdown has been requested and is underway.
         * New subscriptions/publishes should be avoided during this phase.
         */
        RxStompState[RxStompState["CLOSING"] = 2] = "CLOSING";
        /**
         * There is no active connection to the broker.
         * The client may be inactive or waiting to retry based on reconnection settings.
         */
        RxStompState[RxStompState["CLOSED"] = 3] = "CLOSED";
    })(exports.RxStompState || (exports.RxStompState = {}));

    /**
     * Main RxJS-friendly STOMP client for browsers and Node.js.
     *
     * RxStomp wraps {@link Client} from @stomp/stompjs and exposes key interactions
     * (connection lifecycle, subscriptions, frames, and errors) as RxJS streams.
     *
     * What RxStomp adds:
     * - Simple, observable-based API for consuming messages.
     * - Connection lifecycle as BehaviorSubjects/Observables for easy UI binding.
     * - Transparent reconnection support (configurable through {@link RxStompConfig}).
     * - Convenience helpers for receipts and server headers.
     *
     * Typical lifecycle:
     * - Instantiate: `const rxStomp = new RxStomp();`
     * - Configure: `rxStomp.configure({...});`
     * - Activate: `rxStomp.activate();`
     * - Consume: `rxStomp.watch({ destination: '/topic/foo' }).subscribe(...)`
     * - Publish: `rxStomp.publish({ destination: '/topic/foo', body: '...' })`
     * - Deactivate when done: `await rxStomp.deactivate();`
     *
     * Notes:
     * - Except for `beforeConnect`, all callbacks from @stomp/stompjs are exposed
     *   as RxJS Subjects/Observables here.
     * - RxStomp tries to transparently handle connection failures.
     *
     * Part of `@stomp/rx-stomp`.
     */
    class RxStomp {
        /**
         * Instance of actual
         * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
         * {@link Client}.
         *
         * **Be careful in calling methods on it directly - you may get unintended consequences.**
         */
        get stompClient() {
            return this._stompClient;
        }
        /**
         * Constructor
         *
         * @param stompClient Optional existing {@link Client} to wrap. If omitted, a new instance
         * will be created internally.
         *
         * Tip: Injecting a pre-configured Client is useful for advanced customization or testing.
         */
        constructor(stompClient) {
            /**
             * Internal array to hold locally queued messages when STOMP broker is not connected.
             */
            this._queuedMessages = [];
            this._stompClient = stompClient ? stompClient : new stompjs.Client();
            const noOp = () => { };
            // Before connect is no op by default
            this._beforeConnect = noOp;
            // Correlate errors is falsey op by default
            this._correlateErrors = () => undefined;
            // debug is no-op by default
            this._debug = noOp;
            // Initial state is CLOSED
            this._connectionStatePre$ = new rxjs.BehaviorSubject(exports.RxStompState.CLOSED);
            this._connectedPre$ = this._connectionStatePre$.pipe(rxjs.filter((currentState) => {
                return currentState === exports.RxStompState.OPEN;
            }));
            // Initial state is CLOSED
            this.connectionState$ = new rxjs.BehaviorSubject(exports.RxStompState.CLOSED);
            this.connected$ = this.connectionState$.pipe(rxjs.filter((currentState) => {
                return currentState === exports.RxStompState.OPEN;
            }));
            // Setup sending queuedMessages
            this.connected$.subscribe(() => {
                this._sendQueuedMessages();
            });
            this._serverHeadersBehaviourSubject$ =
                new rxjs.BehaviorSubject(null);
            this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(rxjs.filter((headers) => {
                return headers !== null;
            }));
            this.stompErrors$ = new rxjs.Subject();
            this.unhandledMessage$ = new rxjs.Subject();
            this.unhandledReceipts$ = new rxjs.Subject();
            this.unhandledFrame$ = new rxjs.Subject();
            this.webSocketErrors$ = new rxjs.Subject();
        }
        /**
         * Apply configuration to the underlying STOMP client.
         *
         * - Safe to call multiple times; each call merges with existing configuration.
         * - `beforeConnect` and `correlateErrors` are handled by RxStomp and removed
         *   from the object passed to the underlying {@link Client}.
         * - Unless otherwise documented by @stomp/stompjs, most options take effect
         *   on the next (re)connection.
         *
         * Example:
         * ```typescript
         * const rxStomp = new RxStomp();
         * rxStomp.configure({
         *   brokerURL: 'ws://127.0.0.1:15674/ws',
         *   connectHeaders: {
         *     login: 'guest',
         *     passcode: 'guest'
         *     },
         *   heartbeatIncoming: 0,
         *   heartbeatOutgoing: 20000,
         *   reconnectDelay: 200,
         *   debug: (msg) => console.log(new Date(), msg),
         * });
         * rxStomp.activate();
         * ```
         *
         * Maps to: [Client#configure]{@link Client#configure}.
         */
        configure(rxStompConfig) {
            const stompConfig = Object.assign({}, rxStompConfig);
            if (stompConfig.beforeConnect) {
                this._beforeConnect = stompConfig.beforeConnect;
                delete stompConfig.beforeConnect;
            }
            if (stompConfig.correlateErrors) {
                this._correlateErrors = stompConfig.correlateErrors;
                delete stompConfig.correlateErrors;
            }
            // RxStompConfig has subset of StompConfig fields
            this._stompClient.configure(stompConfig);
            if (stompConfig.debug) {
                this._debug = stompConfig.debug;
            }
        }
        /**
         * Activate the client and initiate connection attempts.
         *
         * - Emits `CONNECTING` followed by `OPEN` on successful connect.
         * - Automatically reconnects, according to configuration.
         *
         * To stop auto-reconnect and close the connection, call {@link deactivate}.
         *
         * Maps to: [Client#activate]{@link Client#activate}.
         */
        activate() {
            this._stompClient.configure({
                beforeConnect: async () => {
                    this._changeState(exports.RxStompState.CONNECTING);
                    // Call handler
                    await this._beforeConnect(this);
                },
                onConnect: (frame) => {
                    this._serverHeadersBehaviourSubject$.next(frame.headers);
                    // Indicate our connected state to observers
                    this._changeState(exports.RxStompState.OPEN);
                },
                onStompError: (frame) => {
                    // Trigger the frame subject
                    this.stompErrors$.next(frame);
                },
                onWebSocketClose: () => {
                    this._changeState(exports.RxStompState.CLOSED);
                },
                onUnhandledMessage: (message) => {
                    this.unhandledMessage$.next(message);
                },
                onUnhandledReceipt: (frame) => {
                    this.unhandledReceipts$.next(frame);
                },
                onUnhandledFrame: (frame) => {
                    this.unhandledFrame$.next(frame);
                },
                onWebSocketError: (evt) => {
                    this.webSocketErrors$.next(evt);
                },
            });
            // Attempt connection
            this._stompClient.activate();
        }
        /**
         * Gracefully disconnect (if connected) and stop auto-reconnect.
         *
         * Behavior:
         * - Emits `CLOSING` then `CLOSED`.
         * - If no active WebSocket exists, resolves immediately.
         * - If a WebSocket is active, resolves after it is properly closed.
         *
         * Experimental:
         * - `options.force === true` immediately discards the underlying connection.
         *   See [Client#deactivate]{@link Client#deactivate}.
         *
         * You can call {@link activate} again after awa.
         *
         * Maps to: [Client#deactivate]{@link Client#deactivate}.
         */
        async deactivate(options = {}) {
            this._changeState(exports.RxStompState.CLOSING);
            // The promise will be resolved immediately if there is no active connection
            // otherwise, after it has successfully disconnected.
            await this._stompClient.deactivate(options);
            this._changeState(exports.RxStompState.CLOSED);
        }
        /**
         * Whether the broker connection is currently OPEN.
         *
         * Equivalent to checking `connectionState$.value === RxStompState.OPEN`.
         */
        connected() {
            return this.connectionState$.getValue() === exports.RxStompState.OPEN;
        }
        /**
         * True if the client is ACTIVE — i.e., connected or attempting reconnection.
         *
         * Maps to: [Client#active]{@link Client#active}.
         */
        get active() {
            return this.stompClient.active;
        }
        /**
         * Publish a message to a destination on the broker.
         *
         * Destination semantics and supported headers are broker-specific; consult your broker’s docs
         * for naming conventions (queues, topics, exchanges) and header support.
         *
         * Payload
         * - Text: provide `body` as a string. Convert non-strings yourself (e.g., JSON.stringify).
         * - Binary: provide `binaryBody` as a Uint8Array and set an appropriate `content-type` header.
         *   Some brokers may require explicit configuration for binary frames.
         *
         * Frame sizing and content-length
         * - For text messages, a `content-length` header is added by default.
         *   Set `skipContentLengthHeader: true` to omit it for text frames.
         * - For binary messages, `content-length` is always included.
         *
         * Caution
         * - If a message body contains NULL octets and the `content-length` header is omitted,
         *   many brokers will report an error and disconnect.
         *
         * Offline/queueing behavior
         * - If not connected, messages are queued locally and sent upon reconnection.
         * - To disable this behavior, set `retryIfDisconnected: false` in the parameters.
         *   In that case, this method throws if it cannot send immediately.
         *
         * Related
         * - Broker acknowledgment (receipt) can be tracked using `receipt` headers together with {@link asyncReceipt}.
         *
         * Maps to: [Client#publish]{@link Client#publish}
         *
         * See: {@link IRxStompPublishParams} and {@link IPublishParams}
         *
         * Examples:
         * ```javascript
         * // Text with custom headers
         * rxStomp.publish({ destination: "/queue/test", headers: { priority: 9 }, body: "Hello, STOMP" });
         *
         * // Minimal (destination is required)
         * rxStomp.publish({ destination: "/queue/test", body: "Hello, STOMP" });
         *
         * // Skip content-length header for text
         * rxStomp.publish({ destination: "/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true });
         *
         * // Binary payload
         * const binaryData = generateBinaryData(); // Uint8Array
         * rxStomp.publish({
         *   destination: "/topic/special",
         *   binaryBody: binaryData,
         *   headers: { "content-type": "application/octet-stream" }
         * });
         * ```
         */
        publish(parameters) {
            // retry behaviour is defaulted to true
            const shouldRetry = parameters.retryIfDisconnected == null
                ? true
                : parameters.retryIfDisconnected;
            if (this.connected()) {
                this._stompClient.publish(parameters);
            }
            else if (shouldRetry) {
                this._debug(`Not connected, queueing`);
                this._queuedMessages.push(parameters);
            }
            else {
                throw new Error('Cannot publish while broker is not connected');
            }
        }
        /** It will send queued messages. */
        _sendQueuedMessages() {
            const queuedMessages = this._queuedMessages;
            this._queuedMessages = [];
            if (queuedMessages.length === 0) {
                return;
            }
            this._debug(`Will try sending  ${queuedMessages.length} queued message(s)`);
            for (const queuedMessage of queuedMessages) {
                this._debug(`Attempting to send ${queuedMessage}`);
                this.publish(queuedMessage);
            }
        }
        watch(opts, headers = {}) {
            const defaults = {
                subHeaders: {},
                unsubHeaders: {},
                subscribeOnlyOnce: false,
            };
            let params;
            if (typeof opts === 'string') {
                params = Object.assign({}, defaults, {
                    destination: opts,
                    subHeaders: headers,
                });
            }
            else {
                params = Object.assign({}, defaults, opts);
            }
            /* Well, the logic is complicated but works beautifully. RxJS is indeed wonderful.
             *
             * We need to activate the underlying subscription immediately if Stomp is connected. If not, it should
             * subscribe when it gets next connected. Further, it should re-establish the subscription whenever Stomp
             * successfully reconnects.
             *
             * Actual implementation is simple, we filter the BehaviourSubject 'state' so that we can trigger whenever Stomp is
             * connected. Since 'state' is a BehaviourSubject, if Stomp is already connected, it will immediately trigger.
             *
             * The observable that we return to the caller remains the same across all reconnects, so no special handling needed at
             * the message subscriber.
             */
            this._debug(`Request to subscribe ${params.destination}`);
            const coldObservable = rxjs.Observable.create((messages) => {
                /*
                 * These variables will be used as part of the closure and work their magic during unsubscribe
                 */
                let stompSubscription; // Stomp
                let stompConnectedSubscription; // RxJS
                let connectedPre$ = this._connectedPre$;
                if (params.subscribeOnlyOnce) {
                    connectedPre$ = connectedPre$.pipe(rxjs.take(1));
                }
                const stompErrorsSubscription = this.stompErrors$.subscribe((error) => {
                    const correlatedDestination = this._correlateErrors(error);
                    if (correlatedDestination === params.destination) {
                        messages.error(error);
                    }
                });
                stompConnectedSubscription = connectedPre$.subscribe(() => {
                    this._debug(`Will subscribe to ${params.destination}`);
                    let subHeaders = params.subHeaders;
                    if (typeof subHeaders === 'function') {
                        subHeaders = subHeaders();
                    }
                    stompSubscription = this._stompClient.subscribe(params.destination, (message) => {
                        messages.next(message);
                    }, subHeaders);
                });
                return () => {
                    /* cleanup function, it will be called when no subscribers are left */
                    this._debug(`Stop watching connection state (for ${params.destination})`);
                    stompConnectedSubscription.unsubscribe();
                    stompErrorsSubscription.unsubscribe();
                    if (this.connected()) {
                        this._debug(`Will unsubscribe from ${params.destination} at Stomp`);
                        let unsubHeaders = params.unsubHeaders;
                        if (typeof unsubHeaders === 'function') {
                            unsubHeaders = unsubHeaders();
                        }
                        stompSubscription.unsubscribe(unsubHeaders);
                    }
                    else {
                        this._debug(`Stomp not connected, no need to unsubscribe from ${params.destination} at Stomp`);
                    }
                };
            });
            /**
             * Important - convert it to hot Observable - otherwise, if the user code subscribes
             * to this observable twice, it will subscribe twice to Stomp broker. (This was happening in the current example).
             * A long but good explanatory article at https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339
             */
            return coldObservable.pipe(rxjs.share());
        }
        /**
         * **Deprecated** Please use {@link asyncReceipt}.
         */
        watchForReceipt(receiptId, callback) {
            this._stompClient.watchForReceipt(receiptId, callback);
        }
        /**
         * Wait for a broker RECEIPT matching the provided receipt-id.
         *
         * How it works
         * - To request an acknowledgment for an operation (e.g., publish, subscribe, unsubscribe),
         *   include a `receipt` header in that operation with a unique value.
         * - A compliant broker will respond with a `RECEIPT` frame whose `receipt-id` header equals
         *   the value you sent in the `receipt` header.
         * - This method returns a Promise that resolves with the matching {@link IFrame} when the
         *   corresponding `RECEIPT` arrives.
         *
         * Receipt identifiers
         * - Must be unique per request; generating a UUID or monotonic sequence is typical.
         *
         * Notes
         * - The Promise resolves once for the first matching receipt and then completes.
         * - No timeout is enforced by default; to add one, wrap with your own timeout logic (e.g., Promise.race).
         *
         * Example:
         * ```javascript
         * // Publish with receipt tracking
         * const receiptId = randomText();
         * rxStomp.publish({
         *   destination: "/topic/special",
         *   headers: { receipt: receiptId },
         *   body: msg
         * });
         * const receiptFrame = await rxStomp.asyncReceipt(receiptId); // resolves with the RECEIPT frame
         * ```
         *
         * Maps to: [Client#watchForReceipt]{@link Client#watchForReceipt}
         */
        asyncReceipt(receiptId) {
            return rxjs.firstValueFrom(this.unhandledReceipts$.pipe(rxjs.filter(frame => frame.headers['receipt-id'] === receiptId)));
        }
        _changeState(state) {
            this._connectionStatePre$.next(state);
            this.connectionState$.next(state);
        }
    }

    /**
     * This is a Ninja-level topic.
     *
     * Configuration and customization hooks for RxStomp RPC reply handling.
     *
     * For usage examples, see the guide:
     * /guide/rx-stomp/ng2-stompjs/remote-procedure-call.html
     */
    class RxStompRPCConfig {
    }

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
    class RxStompRPC {
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
            return this.stream(params).pipe(rxjs.first());
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
            return rxjs.Observable.create((rpcObserver) => {
                let defaultMessagesSubscription;
                const correlationId = headers['correlation-id'] || uuid.v4();
                defaultMessagesSubscription = this._repliesObservable
                    .pipe(rxjs.filter((message) => {
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

    Object.defineProperty(exports, "ReconnectionTimeMode", {
        enumerable: true,
        get: function () { return stompjs.ReconnectionTimeMode; }
    });
    Object.defineProperty(exports, "StompHeaders", {
        enumerable: true,
        get: function () { return stompjs.StompHeaders; }
    });
    Object.defineProperty(exports, "StompSocketState", {
        enumerable: true,
        get: function () { return stompjs.StompSocketState; }
    });
    Object.defineProperty(exports, "TickerStrategy", {
        enumerable: true,
        get: function () { return stompjs.TickerStrategy; }
    });
    Object.defineProperty(exports, "Versions", {
        enumerable: true,
        get: function () { return stompjs.Versions; }
    });
    exports.RxStomp = RxStomp;
    exports.RxStompConfig = RxStompConfig;
    exports.RxStompRPC = RxStompRPC;
    exports.RxStompRPCConfig = RxStompRPCConfig;

}));
