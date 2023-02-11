import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, debugFnType, IFrame, IMessage, publishParams, StompHeaders } from '@stomp/stompjs';
import { RxStompConfig } from './rx-stomp-config.js';
import { IRxStompPublishParams } from './i-rx-stomp-publish-params.js';
import { RxStompState } from './rx-stomp-state.js';
import { IWatchParams } from './i-watch-params.js';
/**
 * This is the main Stomp Client.
 * Typically, you will create an instance of this to connect to the STOMP broker.
 *
 * This wraps an instance of [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
 * {@link Client}.
 *
 * The key difference is that it exposes operations as RxJS Observables.
 * For example, when a STOMP endpoint is subscribed it returns an Observable
 * that will stream all received messages.
 *
 * With exception to beforeConnect, functionality related to all callbacks in
 * [@stomp/stompjs Client]{@link Client}
 * is exposed as Observables/Subjects/BehaviorSubjects.
 *
 * RxStomp also tries to transparently handle connection failures.
 *
 * Part of `@stomp/rx-stomp`
 */
export declare class RxStomp {
    /**
     * Connection State
     *
     * It is a BehaviorSubject and will emit current status immediately. This will typically get
     * used to showing current status to the end user.
     */
    readonly connectionState$: BehaviorSubject<RxStompState>;
    /**
     * Will trigger when connection is established.
     * It will trigger every time a (re)connection occurs.
     * If it is already connected, it will trigger immediately.
     * You can safely ignore the value, as it will always be `StompState.OPEN`
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
     * Provides headers from the most recent connection to the server as returned by the CONNECTED frame.
     * If the STOMP connection has already been established, it will trigger immediately.
     * It will trigger for each (re)connection.
     */
    readonly serverHeaders$: Observable<StompHeaders>;
    protected _serverHeadersBehaviourSubject$: BehaviorSubject<null | StompHeaders>;
    /**
     * This will yield any unhandled messages.
     * It is useful for receiving messages sent to RabbitMQ temporary queues.
     *
     * It may also yield stray messages while the server is processing
     * a request to unsubscribe from an endpoint.
     *
     * This Observer will yield the received
     * {@link IMessage}
     * objects.
     *
     * Maps to: [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}
     */
    readonly unhandledMessage$: Subject<IMessage>;
    /**
     * This will yield any unhandled frame.
     * Normally, you should not receive anything here unless a non-compliant STOMP broker
     * is in use or an error.
     *
     * This Observer will yield the received
     * {@link IFrame}
     * objects.
     *
     * Maps to: [Client#onUnhandledFrame]{@link Client#onUnhandledFrame}
     */
    readonly unhandledFrame$: Subject<IFrame>;
    /**
     * STOMP brokers can be requested to notify when an operation is actually completed.
     * Prefer using {@link asyncReceipt}.
     *
     * This Observer will yield the received
     * {@link IFrame}
     * objects.
     *
     * Maps to: [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}
     */
    readonly unhandledReceipts$: Subject<IFrame>;
    /**
     * It will stream all ERROR frames received from the STOMP Broker.
     * A compliant STOMP Broker will close the connection after this type of frame.
     * Please check broker specific documentation for exact behavior.
     *
     * This Observer will yield the received
     * {@link IFrame}
     * objects.
     *
     * Maps to: [Client#onStompError]{@link Client#onStompError}
     */
    readonly stompErrors$: Subject<IFrame>;
    /**
     * It will stream all web socket errors.
     *
     * This Observer will yield the received
     * [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}.
     *
     * Maps to: [Client#onWebSocketError]{@link Client#onWebSocketError}
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
     * @param stompClient optionally inject the
     * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
     * {@link Client} to wrap. If this is not provided, a client will
     * be constructed internally.
     */
    constructor(stompClient?: Client);
    /**
     * Set configuration. This method may be called multiple times.
     * Each call will add to the existing configuration.
     *
     * Example:
     *
     * ```javascript
     *        const rxStomp = new RxStomp();
     *        rxStomp.configure({
     *          brokerURL: 'ws://127.0.0.1:15674/ws',
     *          connectHeaders: {
     *            login: 'guest',
     *            passcode: 'guest'
     *          },
     *          heartbeatIncoming: 0,
     *          heartbeatOutgoing: 20000,
     *          reconnectDelay: 200,
     *          debug: (msg: string): void => {
     *            console.log(new Date(), msg);
     *          }
     *        });
     *        rxStomp.activate();
     * ```
     *
     * Maps to: [Client#configure]{@link Client#configure}
     */
    configure(rxStompConfig: RxStompConfig): void;
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [RxStompConfig#reconnectDelay]{@link RxStompConfig#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [RxStomp#deactivate]{@link RxStomp#deactivate} to disconnect and stop reconnection attempts.
     *
     * Maps to: [Client#activate]{@link Client#activate}
     */
    activate(): void;
    /**
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if the underlying STOMP connection was connected.
     *
     * To reactivate, you can call [RxStomp#activate]{@link RxStomp#activate}.
     *
     * This call is async. It will resolve immediately if there is no underlying active websocket,
     * otherwise, it will resolve after the underlying websocket is properly disposed of.
     *
     * Experimental: Since version 2.0.0, pass `force: true` to immediately discard the underlying connection.
     * See [Client#deactivate]{@link Client#deactivate} for details.
     *
     * Maps to: [Client#deactivate]{@link Client#deactivate}
     */
    deactivate(options?: {
        force?: boolean;
    }): Promise<void>;
    /**
     * It will return `true` if STOMP broker is connected and `false` otherwise.
     */
    connected(): boolean;
    /**
     * If the client is active (connected or going to reconnect).
     *
     *  Maps to: [Client#active]{@link Client#active}
     */
    get active(): boolean;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker-specific headers.
     *
     * `body` must be String.
     * You will need to covert the payload to string in case it is not string (e.g. JSON).
     *
     * To send a binary message body, use binaryBody parameter. It should be a
     * [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
     * Sometimes brokers may not support binary frames out of the box.
     * Please check your broker documentation.
     *
     * The ` content-length` header is automatically added to the STOMP Frame sent to the broker.
     * Set `skipContentLengthHeader` to indicate that `content-length` header should not be added.
     * For binary messages, `content-length` header is always added.
     *
     * Caution: The broker will, most likely, report an error and disconnect if the message body has NULL octet(s)
     * and `content-length` header is missing.
     *
     * The message will get locally queued if the STOMP broker is not connected. It will attempt to
     * publish queued messages as soon as the broker gets connected.
     * If you do not want that behavior,
     * please set [retryIfDisconnected]{@link IRxStompPublishParams#retryIfDisconnected} to `false`
     * in the parameters.
     * When `false`, this function will raise an error if a message could not be sent immediately.
     *
     * Maps to: [Client#publish]{@link Client#publish}
     *
     * See: {@link IRxStompPublishParams} and {@link IPublishParams}
     *
     * ```javascript
     *        rxStomp.publish({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
     *
     *        // Only destination is mandatory parameter
     *        rxStomp.publish({destination: "/queue/test", body: "Hello, STOMP"});
     *
     *        // Skip content-length header in the frame to the broker
     *        rxStomp.publish({"/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true});
     *
     *        var binaryData = generateBinaryData(); // This need to be of type Uint8Array
     *        // setting content-type header is not mandatory, however a good practice
     *        rxStomp.publish({destination: '/topic/special', binaryBody: binaryData,
     *                         headers: {'content-type': 'application/octet-stream'}});
     * ```
     */
    publish(parameters: IRxStompPublishParams): void;
    /** It will send queued messages. */
    protected _sendQueuedMessages(): void;
    /**
     * It will subscribe to server message queues
     *
     * This method can be safely called even if the STOMP broker is not connected.
     * If the underlying STOMP connection drops and reconnects, by default, it will resubscribe automatically.
     * See [IWatchParams#subscribeOnlyOnce]{@link IWatchParams#subscribeOnlyOnce} also.
     *
     * Note that messages might be missed during reconnect. This issue is not specific
     * to this library, but the way STOMP brokers are designed to work.
     *
     * This method has two alternate syntaxes, use [IWatchParams]{@link IWatchParams} if you need to pass additional options.
     *
     * Maps to: [Client#subscribe]{@link Client#subscribe}
     */
    watch(opts: IWatchParams): Observable<IMessage>;
    /**
     * See the [other variant]{@link #watch} for details.
     *
     * @param destination
     * @param headers subscription headers
     */
    watch(destination: string, headers?: StompHeaders): Observable<IMessage>;
    /**
     * **Deprecated** Please use {@link asyncReceipt}.
     */
    watchForReceipt(receiptId: string, callback: (frame: IFrame) => void): void;
    /**
     * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
     * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
     * The value (say receipt-id) for this header needs to be unique for each use. Typically, a sequence, a UUID, a
     * random number or a combination may be used.
     *
     * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
     * The operation needs to be matched based on the value of the receipt-id.
     *
     * This method allows watching for a receipt and invoking the callback
     * when the corresponding receipt has been received.
     *
     * The promise will yield the actual {@link IFrame}.
     *
     * Example:
     * ```javascript
     *        // Publishing with acknowledgement
     *        let receiptId = randomText();
     *
     *        rxStomp.publish({destination: '/topic/special', headers: {receipt: receiptId}, body: msg});
     *        await rxStomp.asyncReceipt(receiptId);; // it yields the actual Frame
     * ```
     *
     * Maps to: [Client#watchForReceipt]{@link Client#watchForReceipt}
     */
    asyncReceipt(receiptId: string): Promise<IFrame>;
    protected _changeState(state: RxStompState): void;
}
