import { filter, share } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Stomp } from '@stomp/stompjs';
import { StompState } from './stomp-state';
/**
 * Angular2 STOMP Raw Service using @stomp/stomp.js
 *
 * You will only need the public properties and
 * methods listed unless you are an advanced user. This service handles subscribing to a
 * message queue using the stomp.js library, and returns
 * values via the ES6 Observable specification for
 * asynchronous value streaming by wiring the STOMP
 * messages into an observable.
 *
 * If you will like to pass the configuration as a dependency,
 * please use StompService class.
 */
var StompRService = /** @class */ (function () {
    /**
     * Constructor
     *
     * See README and samples for configuration examples
     */
    function StompRService() {
        var _this = this;
        /**
         * Internal array to hold locally queued messages when STOMP broker is not connected.
         */
        this.queuedMessages = [];
        /**
         * Callback Functions
         *
         * Note the method signature: () => preserves lexical scope
         * if we need to use this.x inside the function
         */
        this.debug = function (args) {
            console.log(new Date(), args);
        };
        /** Callback run on successfully connecting to server */
        this.on_connect = function (frame) {
            _this.debug('Connected');
            _this._serverHeadersBehaviourSubject.next(frame.headers);
            // Indicate our connected state to observers
            _this._changeState(StompState.CONNECTED);
        };
        this.state = new BehaviorSubject(StompState.CLOSED);
        this.connectObservable = this.state.pipe(filter(function (currentState) {
            return currentState === StompState.CONNECTED;
        }));
        // Setup sending queuedMessages
        this.connectObservable.subscribe(function () {
            _this.sendQueuedMessages();
        });
        this._serverHeadersBehaviourSubject = new BehaviorSubject(null);
        this.serverHeadersObservable = this._serverHeadersBehaviourSubject.pipe(filter(function (headers) {
            return headers !== null;
        }));
        this.stompError$ = new Subject();
    }
    Object.defineProperty(StompRService.prototype, "config", {
        /** Set configuration */
        set: function (value) {
            this._config = value;
        },
        enumerable: true,
        configurable: true
    });
    /** It will initialize STOMP Client. */
    StompRService.prototype.initStompClient = function () {
        // disconnect if connected
        this.disconnect();
        // url takes precedence over socketFn
        if (typeof (this._config.url) === 'string') {
            this.client = Stomp.client(this._config.url);
        }
        else {
            this.client = Stomp.over(this._config.url);
        }
        // Configure client heart-beating
        this.client.heartbeatIncoming = this._config.heartbeat_in;
        this.client.heartbeatOutgoing = this._config.heartbeat_out;
        // Auto reconnect
        this.client.reconnectDelay = this._config.reconnect_delay;
        if (!this._config.debug) {
            this.debug = function () {
            };
        }
        // Set function to debug print messages
        this.client.debug = this.debug;
        // Default messages
        this.setupOnReceive();
        // Receipts
        this.setupReceipts();
    };
    /**
     * It will connect to the STOMP broker.
     */
    StompRService.prototype.initAndConnect = function () {
        var _this = this;
        this.initStompClient();
        if (!this._config.headers) {
            this._config.headers = {};
        }
        this.client.configure({
            onConnect: this.on_connect,
            onStompError: function (frame) {
                // Trigger the frame subject
                _this.stompError$.next(frame);
            },
            onWebSocketClose: function () {
                _this._changeState(StompState.CLOSED);
            },
            connectHeaders: this._config.headers
        });
        // Attempt connection, passing in a callback
        this.client.activate();
        this.debug('Connecting...');
        this._changeState(StompState.TRYING);
    };
    /**
     * It will disconnect from the STOMP broker.
     */
    StompRService.prototype.disconnect = function () {
        // Disconnect if connected. Callback will set CLOSED state
        if (this.client) {
            this.client.deactivate();
            if (!this.client.connected) {
                // Nothing to do
                this._changeState(StompState.CLOSED);
                return;
            }
            // Notify observers that we are disconnecting!
            this._changeState(StompState.DISCONNECTING);
        }
    };
    /**
     * It will return `true` if STOMP broker is connected and `false` otherwise.
     */
    StompRService.prototype.connected = function () {
        return this.state.getValue() === StompState.CONNECTED;
    };
    /**
     * It will send a message to a named destination. The message must be `string`.
     *
     * The message will get locally queued if the STOMP broker is not connected. It will attempt to
     * publish queued messages as soon as the broker gets connected.
     *
     * @param queueName
     * @param message
     * @param headers
     */
    StompRService.prototype.publish = function (queueName, message, headers) {
        if (headers === void 0) { headers = {}; }
        if (this.connected()) {
            this.client.publish({ destination: queueName, headers: headers, body: message });
        }
        else {
            this.debug("Not connected, queueing " + message);
            this.queuedMessages.push({ queueName: queueName, message: message, headers: headers });
        }
    };
    /** It will send queued messages. */
    StompRService.prototype.sendQueuedMessages = function () {
        var queuedMessages = this.queuedMessages;
        this.queuedMessages = [];
        this.debug("Will try sending queued messages " + queuedMessages);
        for (var _i = 0, queuedMessages_1 = queuedMessages; _i < queuedMessages_1.length; _i++) {
            var queuedMessage = queuedMessages_1[_i];
            this.debug("Attempting to send " + queuedMessage);
            this.publish(queuedMessage.queueName, queuedMessage.message, queuedMessage.headers);
        }
    };
    /**
     * It will subscribe to server message queues
     *
     * This method can be safely called even if the STOMP broker is not connected.
     * If the underlying STOMP connection drops and reconnects, it will resubscribe automatically.
     *
     * If a header field 'ack' is not explicitly passed, 'ack' will be set to 'auto'. If you
     * do not understand what it means, please leave it as is.
     *
     * Note that when working with temporary queues where the subscription request
     * creates the
     * underlying queue, mssages might be missed during reconnect. This issue is not specific
     * to this library but the way STOMP brokers are designed to work.
     *
     * @param queueName
     * @param headers
     */
    StompRService.prototype.subscribe = function (queueName, headers) {
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
        this.debug("Request to subscribe " + queueName);
        // By default auto acknowledgement of messages
        if (!headers['ack']) {
            headers['ack'] = 'auto';
        }
        var coldObservable = Observable.create(function (messages) {
            /*
             * These variables will be used as part of the closure and work their magic during unsubscribe
             */
            var stompSubscription;
            var stompConnectedSubscription;
            stompConnectedSubscription = _this.connectObservable
                .subscribe(function () {
                _this.debug("Will subscribe to " + queueName);
                stompSubscription = _this.client.subscribe(queueName, function (message) {
                    messages.next(message);
                }, headers);
            });
            return function () {
                _this.debug("Stop watching connection state (for " + queueName + ")");
                stompConnectedSubscription.unsubscribe();
                if (_this.state.getValue() === StompState.CONNECTED) {
                    _this.debug("Will unsubscribe from " + queueName + " at Stomp");
                    stompSubscription.unsubscribe();
                }
                else {
                    _this.debug("Stomp not connected, no need to unsubscribe from " + queueName + " at Stomp");
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
     * It will handle messages received in the default queue. Messages that would not be handled otherwise
     * get delivered to the default queue.
     */
    StompRService.prototype.setupOnReceive = function () {
        var _this = this;
        this.defaultMessagesObservable = new Subject();
        this.client.onUnhandledMessage = function (message) {
            _this.defaultMessagesObservable.next(message);
        };
    };
    /**
     * It will emit all receipts.
     */
    StompRService.prototype.setupReceipts = function () {
        var _this = this;
        this.receiptsObservable = new Subject();
        this.client.onUnhandledReceipt = function (frame) {
            _this.receiptsObservable.next(frame);
        };
    };
    /**
     * Wait for receipt, this indicates that server has carried out the related operation
     */
    StompRService.prototype.waitForReceipt = function (receiptId, callback) {
        this.client.watchForReceipt(receiptId, callback);
    };
    StompRService.prototype._changeState = function (state) {
        this.state.next(state);
    };
    return StompRService;
}());
export { StompRService };
//# sourceMappingURL=stomp-r.service.js.map