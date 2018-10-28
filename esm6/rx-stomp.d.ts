import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, debugFnType, Frame, Message, publishParams, StompHeaders } from '@stomp/stompjs';
import { RxStompConfig } from './rx-stomp-config';
import { RxStompState } from './rx-stomp-state';
/**
 * This is the main Stomp Client.
 * Typically you will create an instance of this to connect to the STOMP broker.
 *
 * This wraps [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
 * [Client]{@link https://stomp-js.github.io/stompjs/classes/Client.html} class.
 *
 * The key difference is that it exposes operations as RxJS Observables.
 * For example when a STOMP endpoint is subscribed it returns an Observable
 * that will stream all received messages.
 *
 * With exception of beforeConnect, functionality related to all callbacks in
 * [@stomp/stompjs Client]{@link https://stomp-js.github.io/stompjs/classes/Client.html}
 * is exposed as Observables/Subjects/BehaviorSubjects.
 *
 * RxStomp also tries to transparently handle connection failures.
 */
export declare class RxStomp {
    /**
     * Connection State
     *
     * It is a BehaviorSubject and will emit current status immediately. This will typically get
     * used to show current status to the end user.
     */
    connectionState$: BehaviorSubject<RxStompState>;
    /**
     * Will trigger when connection is established.
     * It will trigger every time a (re)connection occurs.
     * If it is already connected it will trigger immediately.
     * You can safely ignore the value, as it will always be `StompState.OPEN`
     */
    connected$: Observable<RxStompState>;
    /**
     * Provides headers from most recent connection to the server as returned by the CONNECTED frame.
     * If the STOMP connection has already been established it will trigger immediately.
     * It will trigger for each reconnection.
     */
    serverHeaders$: Observable<StompHeaders>;
    protected _serverHeadersBehaviourSubject$: BehaviorSubject<null | StompHeaders>;
    /**
     * This function will be called for any unhandled messages.
     * It is useful for receiving messages sent to RabbitMQ temporary queues.
     *
     * It can also get invoked with stray messages while the server is processing
     * a request to unsubscribe from an endpoint.
     *
     * This Observer will yield the received
     * [Message]{@link https://stomp-js.github.io/stompjs/classes/Message.html}
     * objects.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#onUnhandledMessage
     */
    unhandledMessage$: Subject<Message>;
    /**
     * STOMP brokers can be requested to notify when an operation is actually completed.
     * Prefer using [RxStomp#watchForReceipt]{@link RxStomp#watchForReceipt}.
     *
     * This Observer will yield the received
     * [Frame]{@link https://stomp-js.github.io/stompjs/classes/Frame.html}
     * objects.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#onUnhandledReceipt
     */
    unhandledReceipts$: Subject<Frame>;
    /**
     * It will stream all ERROR frames received from the STOMP Broker.
     * A compliant STOMP Broker will close the connection after this type of frame.
     * Please check broker specific documentation for exact behavior.
     *
     * This Observer will yield the received
     * [Frame]{@link https://stomp-js.github.io/stompjs/classes/Frame.html}
     * objects.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#onStompError
     */
    stompErrors$: Subject<Frame>;
    /**
     * Internal array to hold locally queued messages when STOMP broker is not connected.
     */
    protected _queuedMessages: publishParams[];
    /**
     * Instance of actual
     * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
     * [Client]{@link https://stomp-js.github.io/stompjs/classes/Client.html}.
     *
     * **Be careful in calling methods on it directly - you may get unintended consequences.**
     */
    readonly stompClient: Client;
    protected _stompClient: Client;
    /**
     * Before connect
     */
    protected _beforeConnect: () => void;
    /**
     * Will be assigned during configuration, no-op otherwise
     */
    protected _debug: debugFnType;
    /**
     * Constructor
     */
    constructor();
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
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#configure
     */
    configure(rxStompConfig: RxStompConfig): void;
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [RxStompConfig#reconnectDelay]{@link RxStompConfig#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [RxStomp#deactivate]{@link RxStomp#deactivate} to disconnect and stop reconnection attempts.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#activate
     */
    activate(): void;
    /**
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     *
     * To reactivate you can call [RxStomp#activate]{@link RxStomp#activate}.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#deactivate
     */
    deactivate(): void;
    /**
     * It will return `true` if STOMP broker is connected and `false` otherwise.
     */
    connected(): boolean;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker specific headers.
     *
     * `body` must be String.
     * You will need to covert the payload to string in case it is not string (e.g. JSON).
     *
     * To send a binary message body use binaryBody parameter. It should be a
     * [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
     * Sometimes brokers may not support binary frames out of the box.
     * Please check your broker documentation.
     *
     * `content-length` header is automatically added to the STOMP Frame sent to the broker.
     * Set `skipContentLengthHeader` to indicate that `content-length` header should not be added.
     * For binary messages `content-length` header is always added.
     *
     * Caution: The broker will, most likely, report an error and disconnect if message body has NULL octet(s)
     * and `content-length` header is missing.
     *
     * See: https://stomp-js.github.io/stompjs/interfaces/publishParams.html
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
     *
     * The message will get locally queued if the STOMP broker is not connected. It will attempt to
     * publish queued messages as soon as the broker gets connected.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#publish
     */
    publish(parameters: publishParams): void;
    /** It will send queued messages. */
    protected _sendQueuedMessages(): void;
    /**
     * It will subscribe to server message queues
     *
     * This method can be safely called even if the STOMP broker is not connected.
     * If the underlying STOMP connection drops and reconnects, it will resubscribe automatically.
     *
     * Note that messages might be missed during reconnect. This issue is not specific
     * to this library but the way STOMP brokers are designed to work.
     *
     * This method in the underlying library is called `subscribe`.
     * In earlier version it was called `subscribe` here as well.
     * However `subscribe` is also used by RxJS and code read quite strange with two subscribe calls
     * following each other and both meaning very different things.
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#subscribe
     */
    watch(destination: string, headers?: StompHeaders): Observable<Message>;
    /**
     * Setup streaming unhandled messages.
     */
    protected _setupUnhandledMessages(): void;
    /**
     * Setup streaming unhandled receipts.
     */
    protected _setupUnhandledReceipts(): void;
    /**
     * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
     * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
     * The value (say receipt-id) for this header needs to be unique for each use. Typically a sequence, a UUID, a
     * random number or a combination may be used.
     *
     * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
     * The operation needs to be matched based in the value of the receipt-id.
     *
     * This method allow watching for a receipt and invoke the callback
     * when corresponding receipt has been received.
     *
     * The actual {@link https://stomp-js.github.io/stompjs/classes/Frame.html}
     * will be passed as parameter to the callback.
     *
     * Example:
     * ```javascript
     *        // Publishing with acknowledgement
     *        let receiptId = randomText();
     *
     *        rxStomp.watchForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *        rxStomp.publish({destination: TEST.destination, headers: {receipt: receiptId}, body: msg});
     * ```
     *
     * Maps to: https://stomp-js.github.io/stompjs/classes/Client.html#watchForReceipt
     */
    waitForReceipt(receiptId: string, callback: (frame: Frame) => void): void;
    protected _changeState(state: RxStompState): void;
}
