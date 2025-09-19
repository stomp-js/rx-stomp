import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, debugFnType, IFrame, IMessage, publishParams, StompHeaders } from '@stomp/stompjs';
import { RxStompConfig } from './rx-stomp-config.js';
import { IRxStompPublishParams } from './i-rx-stomp-publish-params.js';
import { RxStompState } from './rx-stomp-state.js';
import { IWatchParams } from './i-watch-params.js';
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
export declare class RxStomp {
    /**
     * Connection state as a BehaviorSubject.
     *
     * - Emits immediately with the current state (initially `CLOSED`).
     * - Use this for binding UI widgets or guards based on connection status.
     * - State values are from {@link RxStompState}.
     */
    readonly connectionState$: BehaviorSubject<RxStompState>;
    /**
     * Emits whenever a connection is established (including re-connections).
     *
     * - If already connected, it emits immediately on subscription.
     * - The emitted value is always `RxStompState.OPEN`.
     * - Useful as a trigger to (re)establish subscriptions or flush local queues.
     */
    readonly connected$: Observable<RxStompState>;
    /**
     * These will be triggered before connectionState$ and connected$.
     * During reconnecting, it will allow subscriptions to be reinstated before sending
     * queued messages.
     */
    private _connectionStatePre$;
    private _connectedPre$;
    /**
     * Provides headers from the most recent CONNECTED frame from the broker.
     *
     * - Emits on every successful (re)connection.
     * - If already connected, emits immediately on subscription.
     * - Typical headers include `server`, `session`, and negotiated `version`.
     */
    readonly serverHeaders$: Observable<StompHeaders>;
    protected _serverHeadersBehaviourSubject$: BehaviorSubject<null | StompHeaders>;
    /**
     * Streams any unhandled MESSAGE frames.
     *
     * Use this to receive:
     * - (RabbitMQ specific) Messages delivered to temporary or auto-named queues.
     * - Stray messages arriving during unsubscribe processing.
     *
     * Emits raw {@link IMessage} instances.
     *
     * Maps to: [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     */
    readonly unhandledMessage$: Subject<IMessage>;
    /**
     * Streams any unhandled non-MESSAGE, non-ERROR frames.
     *
     * Normally unused unless interacting with non-compliant brokers or testing.
     *
     * Emits raw {@link IFrame} instances.
     *
     * Maps to: [Client#onUnhandledFrame]{@link Client#onUnhandledFrame}.
     */
    readonly unhandledFrame$: Subject<IFrame>;
    /**
     * Streams any RECEIPT frames that do not match a watcher set via asyncReceipt helpers.
     *
     * Prefer {@link asyncReceipt} patterns where possible; fall back to this for low-level needs.
     *
     * Emits raw {@link IFrame} instances.
     *
     * Maps to: [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     */
    readonly unhandledReceipts$: Subject<IFrame>;
    /**
     * Streams all ERROR frames from the broker.
     *
     * Most brokers will close the connection after an ERROR frame.
     *
     * Emits raw {@link IFrame} instances.
     *
     * Maps to: [Client#onStompError]{@link Client#onStompError}.
     */
    readonly stompErrors$: Subject<IFrame>;
    /**
     * Streams errors emitted by the underlying WebSocket.
     *
     * Emits a DOM {@link Event}.
     *
     * Maps to: [Client#onWebSocketError]{@link Client#onWebSocketError}.
     */
    readonly webSocketErrors$: Subject<Event>;
    /**
     * Internal array to hold locally queued messages when STOMP broker is not connected.
     */
    protected _queuedMessages: publishParams[];
    /**
     * Instance of actual
     * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
     * {@link Client}.
     *
     * **Be careful in calling methods on it directly - you may get unintended consequences.**
     */
    get stompClient(): Client;
    protected _stompClient: Client;
    /**
     * Before connect
     */
    protected _beforeConnect: (client: RxStomp) => void | Promise<void>;
    /**
     * Correlate errors
     */
    protected _correlateErrors: (error: IFrame) => string;
    /**
     * Will be assigned during configuration, no-op otherwise
     */
    protected _debug: debugFnType;
    /**
     * Constructor
     *
     * @param stompClient Optional existing {@link Client} to wrap. If omitted, a new instance
     * will be created internally.
     *
     * Tip: Injecting a pre-configured Client is useful for advanced customization or testing.
     */
    constructor(stompClient?: Client);
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
    configure(rxStompConfig: RxStompConfig): void;
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
    activate(): void;
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
    deactivate(options?: {
        force?: boolean;
    }): Promise<void>;
    /**
     * Whether the broker connection is currently OPEN.
     *
     * Equivalent to checking `connectionState$.value === RxStompState.OPEN`.
     */
    connected(): boolean;
    /**
     * True if the client is ACTIVE — i.e., connected or attempting reconnection.
     *
     * Maps to: [Client#active]{@link Client#active}.
     */
    get active(): boolean;
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
    publish(parameters: IRxStompPublishParams): void;
    /** It will send queued messages. */
    protected _sendQueuedMessages(): void;
    /**
     * Subscribe to a destination and receive messages as an RxJS Observable.
     *
     * Connection resilience
     * - Safe to call when disconnected; it will subscribe upon the next connection.
     * - On reconnect, it re-subscribes automatically to the same destination unless
     *   `subscribeOnlyOnce: true` is specified.
     * - Messages may be missed during broker-side reconnect windows (typical for STOMP brokers).
     *
     * Options
     * - Provide an {@link IWatchParams} object to set subscription (`subHeaders`) and unsubscription
     *   (`unsubHeaders`) headers, and to control resubscription behavior (`subscribeOnlyOnce`).
     *
     * Returns
     * - A hot Observable that remains stable across reconnects. Multiple subscribers share the
     *   same underlying STOMP subscription.
     *
     * Maps to: [Client#subscribe]{@link Client#subscribe}
     */
    watch(opts: IWatchParams): Observable<IMessage>;
    /**
     * See the other overload for details.
     *
     * @param destination Destination to subscribe to
     * @param headers Optional subscription headers
     */
    watch(destination: string, headers?: StompHeaders): Observable<IMessage>;
    /**
     * **Deprecated** Please use {@link asyncReceipt}.
     */
    watchForReceipt(receiptId: string, callback: (frame: IFrame) => void): void;
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
    asyncReceipt(receiptId: string): Promise<IFrame>;
    protected _changeState(state: RxStompState): void;
}
