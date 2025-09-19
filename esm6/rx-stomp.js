import { BehaviorSubject, filter, firstValueFrom, Observable, share, Subject, take, } from 'rxjs';
import { Client, } from '@stomp/stompjs';
import { RxStompState } from './rx-stomp-state.js';
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
export class RxStomp {
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
        this._stompClient = stompClient ? stompClient : new Client();
        const noOp = () => { };
        // Before connect is no op by default
        this._beforeConnect = noOp;
        // Correlate errors is falsey op by default
        this._correlateErrors = () => undefined;
        // debug is no-op by default
        this._debug = noOp;
        // Initial state is CLOSED
        this._connectionStatePre$ = new BehaviorSubject(RxStompState.CLOSED);
        this._connectedPre$ = this._connectionStatePre$.pipe(filter((currentState) => {
            return currentState === RxStompState.OPEN;
        }));
        // Initial state is CLOSED
        this.connectionState$ = new BehaviorSubject(RxStompState.CLOSED);
        this.connected$ = this.connectionState$.pipe(filter((currentState) => {
            return currentState === RxStompState.OPEN;
        }));
        // Setup sending queuedMessages
        this.connected$.subscribe(() => {
            this._sendQueuedMessages();
        });
        this._serverHeadersBehaviourSubject$ =
            new BehaviorSubject(null);
        this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(filter((headers) => {
            return headers !== null;
        }));
        this.stompErrors$ = new Subject();
        this.unhandledMessage$ = new Subject();
        this.unhandledReceipts$ = new Subject();
        this.unhandledFrame$ = new Subject();
        this.webSocketErrors$ = new Subject();
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
                this._changeState(RxStompState.CONNECTING);
                // Call handler
                await this._beforeConnect(this);
            },
            onConnect: (frame) => {
                this._serverHeadersBehaviourSubject$.next(frame.headers);
                // Indicate our connected state to observers
                this._changeState(RxStompState.OPEN);
            },
            onStompError: (frame) => {
                // Trigger the frame subject
                this.stompErrors$.next(frame);
            },
            onWebSocketClose: () => {
                this._changeState(RxStompState.CLOSED);
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
        this._changeState(RxStompState.CLOSING);
        // The promise will be resolved immediately if there is no active connection
        // otherwise, after it has successfully disconnected.
        await this._stompClient.deactivate(options);
        this._changeState(RxStompState.CLOSED);
    }
    /**
     * Whether the broker connection is currently OPEN.
     *
     * Equivalent to checking `connectionState$.value === RxStompState.OPEN`.
     */
    connected() {
        return this.connectionState$.getValue() === RxStompState.OPEN;
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
        const coldObservable = Observable.create((messages) => {
            /*
             * These variables will be used as part of the closure and work their magic during unsubscribe
             */
            let stompSubscription; // Stomp
            let stompConnectedSubscription; // RxJS
            let connectedPre$ = this._connectedPre$;
            if (params.subscribeOnlyOnce) {
                connectedPre$ = connectedPre$.pipe(take(1));
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
        return coldObservable.pipe(share());
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
        return firstValueFrom(this.unhandledReceipts$.pipe(filter(frame => frame.headers['receipt-id'] === receiptId)));
    }
    _changeState(state) {
        this._connectionStatePre$.next(state);
        this.connectionState$.next(state);
    }
}
//# sourceMappingURL=rx-stomp.js.map