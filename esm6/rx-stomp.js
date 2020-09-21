"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const stompjs_1 = require("@stomp/stompjs");
const rx_stomp_state_1 = require("./rx-stomp-state");
/**
 * This is the main Stomp Client.
 * Typically you will create an instance of this to connect to the STOMP broker.
 *
 * This wraps [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
 * {@link Client} class.
 *
 * The key difference is that it exposes operations as RxJS Observables.
 * For example when a STOMP endpoint is subscribed it returns an Observable
 * that will stream all received messages.
 *
 * With exception of beforeConnect, functionality related to all callbacks in
 * [@stomp/stompjs Client]{@link Client}
 * is exposed as Observables/Subjects/BehaviorSubjects.
 *
 * RxStomp also tries to transparently handle connection failures.
 *
 * Part of `@stomp/rx-stomp`
 */
class RxStomp {
    /**
     * Constructor
     */
    constructor() {
        /**
         * Internal array to hold locally queued messages when STOMP broker is not connected.
         */
        this._queuedMessages = [];
        this._stompClient = new stompjs_1.Client();
        const noOp = () => { };
        // Before connect is no op by default
        this._beforeConnect = noOp;
        // debug is no-op by default
        this._debug = noOp;
        // Initial state is CLOSED
        this._connectionStatePre$ = new rxjs_1.BehaviorSubject(rx_stomp_state_1.RxStompState.CLOSED);
        this._connectedPre$ = this._connectionStatePre$.pipe(operators_1.filter((currentState) => {
            return currentState === rx_stomp_state_1.RxStompState.OPEN;
        }));
        // Initial state is CLOSED
        this.connectionState$ = new rxjs_1.BehaviorSubject(rx_stomp_state_1.RxStompState.CLOSED);
        this.connected$ = this.connectionState$.pipe(operators_1.filter((currentState) => {
            return currentState === rx_stomp_state_1.RxStompState.OPEN;
        }));
        // Setup sending queuedMessages
        this.connected$.subscribe(() => {
            this._sendQueuedMessages();
        });
        this._serverHeadersBehaviourSubject$ = new rxjs_1.BehaviorSubject(null);
        this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(operators_1.filter((headers) => {
            return headers !== null;
        }));
        this.stompErrors$ = new rxjs_1.Subject();
        this.unhandledMessage$ = new rxjs_1.Subject();
        this.unhandledReceipts$ = new rxjs_1.Subject();
        this.unhandledFrame$ = new rxjs_1.Subject();
        this.webSocketErrors$ = new rxjs_1.Subject();
    }
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
    configure(rxStompConfig) {
        const stompConfig = Object.assign({}, rxStompConfig);
        if (stompConfig.beforeConnect) {
            this._beforeConnect = stompConfig.beforeConnect;
            delete stompConfig.beforeConnect;
        }
        // RxStompConfig has subset of StompConfig fields
        this._stompClient.configure(stompConfig);
        if (stompConfig.debug) {
            this._debug = stompConfig.debug;
        }
    }
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [RxStompConfig#reconnectDelay]{@link RxStompConfig#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [RxStomp#deactivate]{@link RxStomp#deactivate} to disconnect and stop reconnection attempts.
     *
     * Maps to: [Client#activate]{@link Client#activate}
     */
    activate() {
        this._stompClient.configure({
            beforeConnect: async () => {
                this._changeState(rx_stomp_state_1.RxStompState.CONNECTING);
                // Call handler
                await this._beforeConnect(this);
            },
            onConnect: (frame) => {
                this._serverHeadersBehaviourSubject$.next(frame.headers);
                // Indicate our connected state to observers
                this._changeState(rx_stomp_state_1.RxStompState.OPEN);
            },
            onStompError: (frame) => {
                // Trigger the frame subject
                this.stompErrors$.next(frame);
            },
            onWebSocketClose: () => {
                this._changeState(rx_stomp_state_1.RxStompState.CLOSED);
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
            }
        });
        // Attempt connection
        this._stompClient.activate();
    }
    /**
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     *
     * To reactivate you can call [RxStomp#activate]{@link RxStomp#activate}.
     *
     * Maps to: [Client#deactivate]{@link Client#deactivate}
     */
    deactivate() {
        // Disconnect if connected. Callback will set CLOSED state
        this._stompClient.deactivate();
        const stompState = this.connectionState$.getValue();
        if (stompState === rx_stomp_state_1.RxStompState.OPEN) {
            // Notify observers that we are disconnecting!
            this._changeState(rx_stomp_state_1.RxStompState.CLOSING);
        }
        // This is bit tricky situation, it would be better handled at stompjs level
        if (stompState === rx_stomp_state_1.RxStompState.CONNECTING) {
            // Notify observers that we are disconnecting!
            this._changeState(rx_stomp_state_1.RxStompState.CLOSED);
        }
    }
    /**
     * It will return `true` if STOMP broker is connected and `false` otherwise.
     */
    connected() {
        return this.connectionState$.getValue() === rx_stomp_state_1.RxStompState.OPEN;
    }
    /**
     * If the client is active (connected or going to reconnect).
     *
     *  Maps to: [Client#active]{@link Client#active}
     */
    get active() {
        return this.stompClient.active;
    }
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
     * The message will get locally queued if the STOMP broker is not connected. It will attempt to
     * publish queued messages as soon as the broker gets connected.
     * If you do not want that behavior,
     * please set [retryIfDisconnected]{@link IRxStompPublishParams#retryIfDisconnected} to `false`
     * in the parameters.
     * When `false`, this function will raise an error if message could not be sent immediately.
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
     * Maps to: [Client#subscribe]{@link Client#subscribe}
     */
    watch(destination, headers = {}) {
        /* Well the logic is complicated but works beautifully. RxJS is indeed wonderful.
         *
         * We need to activate the underlying subscription immediately if Stomp is connected. If not it should
         * subscribe when it gets next connected. Further it should re establish the subscription whenever Stomp
         * successfully reconnects.
         *
         * Actual implementation is simple, we filter the BehaviourSubject 'state' so that we can trigger whenever Stomp is
         * connected. Since 'state' is a BehaviourSubject, if Stomp is already connected, it will immediately trigger.
         *
         * The observable that we return to caller remains same across all reconnects, so no special handling needed at
         * the message subscriber.
         */
        this._debug(`Request to subscribe ${destination}`);
        // By default auto acknowledgement of messages
        if (!headers.ack) {
            headers.ack = 'auto';
        }
        const coldObservable = rxjs_1.Observable.create((messages) => {
            /*
             * These variables will be used as part of the closure and work their magic during unsubscribe
             */
            let stompSubscription;
            let stompConnectedSubscription;
            stompConnectedSubscription = this._connectedPre$.subscribe(() => {
                this._debug(`Will subscribe to ${destination}`);
                stompSubscription = this._stompClient.subscribe(destination, (message) => {
                    messages.next(message);
                }, headers);
            });
            return () => {
                this._debug(`Stop watching connection state (for ${destination})`);
                stompConnectedSubscription.unsubscribe();
                if (this.connected()) {
                    this._debug(`Will unsubscribe from ${destination} at Stomp`);
                    stompSubscription.unsubscribe();
                }
                else {
                    this._debug(`Stomp not connected, no need to unsubscribe from ${destination} at Stomp`);
                }
            };
        });
        /**
         * Important - convert it to hot Observable - otherwise, if the user code subscribes
         * to this observable twice, it will subscribe twice to Stomp broker. (This was happening in the current example).
         * A long but good explanatory article at https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339
         */
        return coldObservable.pipe(operators_1.share());
    }
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
     * The actual {@link Frame}
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
     *        rxStomp.publish({destination: '/topic/special', headers: {receipt: receiptId}, body: msg});
     * ```
     *
     * Maps to: [Client#watchForReceipt]{@link Client#watchForReceipt}
     */
    watchForReceipt(receiptId, callback) {
        this._stompClient.watchForReceipt(receiptId, callback);
    }
    _changeState(state) {
        this._connectionStatePre$.next(state);
        this.connectionState$.next(state);
    }
}
exports.RxStomp = RxStomp;
//# sourceMappingURL=rx-stomp.js.map