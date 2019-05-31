var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { Client } from '@stomp/stompjs';
import { RxStompState } from './rx-stomp-state';
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
 * Prat of `@stomp/rx-stomp`
 */
var RxStomp = /** @class */ (function () {
    /**
     * Constructor
     */
    function RxStomp() {
        var _this = this;
        /**
         * Internal array to hold locally queued messages when STOMP broker is not connected.
         */
        this._queuedMessages = [];
        this._stompClient = new Client();
        var noOp = function () { };
        // Before connect is no op by default
        this._beforeConnect = noOp;
        // debug is no-op by default
        this._debug = noOp;
        // Initial state is CLOSED
        this._connectionStatePre$ = new BehaviorSubject(RxStompState.CLOSED);
        this._connectedPre$ = this._connectionStatePre$.pipe(filter(function (currentState) {
            return currentState === RxStompState.OPEN;
        }));
        // Initial state is CLOSED
        this.connectionState$ = new BehaviorSubject(RxStompState.CLOSED);
        this.connected$ = this.connectionState$.pipe(filter(function (currentState) {
            return currentState === RxStompState.OPEN;
        }));
        // Setup sending queuedMessages
        this.connected$.subscribe(function () {
            _this._sendQueuedMessages();
        });
        this._serverHeadersBehaviourSubject$ = new BehaviorSubject(null);
        this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(filter(function (headers) {
            return headers !== null;
        }));
        this.stompErrors$ = new Subject();
        this.unhandledMessage$ = new Subject();
        this.unhandledReceipts$ = new Subject();
        this.unhandledFrame$ = new Subject();
        this.webSocketErrors$ = new Subject();
    }
    Object.defineProperty(RxStomp.prototype, "stompClient", {
        /**
         * Instance of actual
         * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
         * {@link Client}.
         *
         * **Be careful in calling methods on it directly - you may get unintended consequences.**
         */
        get: function () {
            return this._stompClient;
        },
        enumerable: true,
        configurable: true
    });
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
    RxStomp.prototype.configure = function (rxStompConfig) {
        var stompConfig = Object.assign({}, rxStompConfig);
        if (stompConfig.beforeConnect) {
            this._beforeConnect = stompConfig.beforeConnect;
            delete stompConfig.beforeConnect;
        }
        // RxStompConfig has subset of StompConfig fields
        this._stompClient.configure(stompConfig);
        if (stompConfig.debug) {
            this._debug = stompConfig.debug;
        }
    };
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [RxStompConfig#reconnectDelay]{@link RxStompConfig#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [RxStomp#deactivate]{@link RxStomp#deactivate} to disconnect and stop reconnection attempts.
     *
     * Maps to: [Client#activate]{@link Client#activate}
     */
    RxStomp.prototype.activate = function () {
        var _this = this;
        this._stompClient.configure({
            beforeConnect: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this._changeState(RxStompState.CONNECTING);
                            // Call handler
                            return [4 /*yield*/, this._beforeConnect()];
                        case 1:
                            // Call handler
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            onConnect: function (frame) {
                _this._serverHeadersBehaviourSubject$.next(frame.headers);
                // Indicate our connected state to observers
                _this._changeState(RxStompState.OPEN);
            },
            onStompError: function (frame) {
                // Trigger the frame subject
                _this.stompErrors$.next(frame);
            },
            onWebSocketClose: function () {
                _this._changeState(RxStompState.CLOSED);
            },
            onUnhandledMessage: function (message) {
                _this.unhandledMessage$.next(message);
            },
            onUnhandledReceipt: function (frame) {
                _this.unhandledReceipts$.next(frame);
            },
            onUnhandledFrame: function (frame) {
                _this.unhandledFrame$.next(frame);
            },
            onWebSocketError: function (evt) {
                _this.webSocketErrors$.next(evt);
            }
        });
        // Attempt connection
        this._stompClient.activate();
    };
    /**
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     *
     * To reactivate you can call [RxStomp#activate]{@link RxStomp#activate}.
     *
     * Maps to: [Client#deactivate]{@link Client#deactivate}
     */
    RxStomp.prototype.deactivate = function () {
        // Disconnect if connected. Callback will set CLOSED state
        this._stompClient.deactivate();
        var stompState = this.connectionState$.getValue();
        if (stompState === RxStompState.OPEN) {
            // Notify observers that we are disconnecting!
            this._changeState(RxStompState.CLOSING);
        }
        // This is bit tricky situation, it would be better handled at stompjs level
        if (stompState === RxStompState.CONNECTING) {
            // Notify observers that we are disconnecting!
            this._changeState(RxStompState.CLOSED);
        }
    };
    /**
     * It will return `true` if STOMP broker is connected and `false` otherwise.
     */
    RxStomp.prototype.connected = function () {
        return this.connectionState$.getValue() === RxStompState.OPEN;
    };
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
     * See: {@link publishParams}
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
     * publish queued messages as soon as the broker gets connected if enabled in config
     *
     * Maps to: [Client#publish]{@link Client#publish}
     */
    RxStomp.prototype.publish = function (parameters) {
        if (this.connected()) {
            this._stompClient.publish(parameters);
        }
        else if (parameters.retryIfDisconnected != null && parameters.retryIfDisconnected) {
            this._debug("Not connected, queueing");
            this._queuedMessages.push(parameters);
        }
        else {
            throw new Error('Cannot publish while broker is not connected');
        }
    };
    /** It will send queued messages. */
    RxStomp.prototype._sendQueuedMessages = function () {
        var queuedMessages = this._queuedMessages;
        this._queuedMessages = [];
        if (queuedMessages.length === 0) {
            return;
        }
        this._debug("Will try sending  " + queuedMessages.length + " queued message(s)");
        for (var _i = 0, queuedMessages_1 = queuedMessages; _i < queuedMessages_1.length; _i++) {
            var queuedMessage = queuedMessages_1[_i];
            this._debug("Attempting to send " + queuedMessage);
            this.publish(queuedMessage);
        }
    };
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
    RxStomp.prototype.watch = function (destination, headers) {
        var _this = this;
        if (headers === void 0) { headers = {}; }
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
        this._debug("Request to subscribe " + destination);
        // By default auto acknowledgement of messages
        if (!headers.ack) {
            headers.ack = 'auto';
        }
        var coldObservable = Observable.create(function (messages) {
            /*
             * These variables will be used as part of the closure and work their magic during unsubscribe
             */
            var stompSubscription;
            var stompConnectedSubscription;
            stompConnectedSubscription = _this._connectedPre$.subscribe(function () {
                _this._debug("Will subscribe to " + destination);
                stompSubscription = _this._stompClient.subscribe(destination, function (message) {
                    messages.next(message);
                }, headers);
            });
            return function () {
                _this._debug("Stop watching connection state (for " + destination + ")");
                stompConnectedSubscription.unsubscribe();
                if (_this.connected()) {
                    _this._debug("Will unsubscribe from " + destination + " at Stomp");
                    stompSubscription.unsubscribe();
                }
                else {
                    _this._debug("Stomp not connected, no need to unsubscribe from " + destination + " at Stomp");
                }
            };
        });
        /**
         * Important - convert it to hot Observable - otherwise, if the user code subscribes
         * to this observable twice, it will subscribe twice to Stomp broker. (This was happening in the current example).
         * A long but good explanatory article at https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339
         */
        return coldObservable.pipe(share());
    };
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
    RxStomp.prototype.watchForReceipt = function (receiptId, callback) {
        this._stompClient.watchForReceipt(receiptId, callback);
    };
    RxStomp.prototype._changeState = function (state) {
        this._connectionStatePre$.next(state);
        this.connectionState$.next(state);
    };
    return RxStomp;
}());
export { RxStomp };
//# sourceMappingURL=rx-stomp.js.map