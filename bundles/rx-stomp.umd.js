(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("@stomp/stompjs"), require("rxjs"), require("rxjs/operators"));
	else if(typeof define === 'function' && define.amd)
		define("RxStomp", ["@stomp/stompjs", "rxjs", "rxjs/operators"], factory);
	else if(typeof exports === 'object')
		exports["RxStomp"] = factory(require("@stomp/stompjs"), require("rxjs"), require("rxjs/operators"));
	else
		root["RxStomp"] = factory(root["StompJs"], root["rxjs"], root["rxjs"]["operators"]);
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE__stomp_stompjs__, __WEBPACK_EXTERNAL_MODULE_rxjs__, __WEBPACK_EXTERNAL_MODULE_rxjs_operators__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/angular2-uuid/index.js":
/*!*********************************************!*\
  !*** ./node_modules/angular2-uuid/index.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var UUID = (function () {
    function UUID() {
        // no-op
    }
    UUID.UUID = function () {
        if (typeof (window) !== "undefined" && typeof (window.crypto) !== "undefined" && typeof (window.crypto.getRandomValues) !== "undefined") {
            // If we have a cryptographically secure PRNG, use that
            // http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
            var buf = new Uint16Array(8);
            window.crypto.getRandomValues(buf);
            return (this.pad4(buf[0]) + this.pad4(buf[1]) + "-" + this.pad4(buf[2]) + "-" + this.pad4(buf[3]) + "-" + this.pad4(buf[4]) + "-" + this.pad4(buf[5]) + this.pad4(buf[6]) + this.pad4(buf[7]));
        }
        else {
            // Otherwise, just use Math.random
            // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
            // https://stackoverflow.com/questions/11605068/why-does-jshint-argue-against-bitwise-operators-how-should-i-express-this-code
            return this.random4() + this.random4() + "-" + this.random4() + "-" + this.random4() + "-" +
                this.random4() + "-" + this.random4() + this.random4() + this.random4();
        }
    };
    UUID.pad4 = function (num) {
        var ret = num.toString(16);
        while (ret.length < 4) {
            ret = "0" + ret;
        }
        return ret;
    };
    UUID.random4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };
    return UUID;
}());
exports.UUID = UUID;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./rx-stomp-config */ "./src/rx-stomp-config.ts"));
__export(__webpack_require__(/*! ./rx-stomp */ "./src/rx-stomp.ts"));
__export(__webpack_require__(/*! ./rx-stomp-state */ "./src/rx-stomp-state.ts"));
__export(__webpack_require__(/*! ./rx-stomp-rpc-config */ "./src/rx-stomp-rpc-config.ts"));
__export(__webpack_require__(/*! ./rx-stomp-rpc */ "./src/rx-stomp-rpc.ts"));


/***/ }),

/***/ "./src/rx-stomp-config.ts":
/*!********************************!*\
  !*** ./src/rx-stomp-config.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a configuration object for RxSTOMP.
 * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
 *
 * All the attributes of this calls are optional.
 *
 * Part of `@stomp/rx-stomp`
 */
class RxStompConfig {
}
exports.RxStompConfig = RxStompConfig;


/***/ }),

/***/ "./src/rx-stomp-rpc-config.ts":
/*!************************************!*\
  !*** ./src/rx-stomp-rpc-config.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RPC Config. See the guide for example.
 */
class RxStompRPCConfig {
}
exports.RxStompRPCConfig = RxStompRPCConfig;


/***/ }),

/***/ "./src/rx-stomp-rpc.ts":
/*!*****************************!*\
  !*** ./src/rx-stomp-rpc.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const operators_1 = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
const angular2_uuid_1 = __webpack_require__(/*! angular2-uuid */ "./node_modules/angular2-uuid/index.js");
/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
class RxStompRPC {
    /**
     * Create an instance, see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for details.
     */
    constructor(rxStomp, stompRPCConfig) {
        this.rxStomp = rxStomp;
        this.stompRPCConfig = stompRPCConfig;
        this._replyQueueName = '/temp-queue/rpc-replies';
        this._setupReplyQueue = () => {
            return this.rxStomp.unhandledMessage$;
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
     * See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for example.
     *
     * It is a simple wrapper around [RxStompRPC#stream]{@link RxStompRPC#stream}.
     */
    rpc(params) {
        // We know there will be only one message in reply
        return this.stream(params).pipe(operators_1.first());
    }
    /**
     * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
     *
     * Note: This call internally takes care of generating a correlation id,
     * however, if `correlation-id` is passed via `headers`, that will be used instead.
     */
    stream(params) {
        const headers = Object.assign({}, params.headers || {});
        const { destination, body, binaryBody } = params;
        if (!this._repliesObservable) {
            this._repliesObservable = this._setupReplyQueue(this._replyQueueName, this.rxStomp);
        }
        return rxjs_1.Observable.create((rpcObserver) => {
            let defaultMessagesSubscription;
            const correlationId = headers['correlation-id'] || angular2_uuid_1.UUID.UUID();
            defaultMessagesSubscription = this._repliesObservable.pipe(operators_1.filter((message) => {
                return message.headers['correlation-id'] === correlationId;
            })).subscribe((message) => {
                rpcObserver.next(message);
            });
            // send an RPC request
            headers['reply-to'] = this._replyQueueName;
            headers['correlation-id'] = correlationId;
            this.rxStomp.publish({ destination, body, binaryBody, headers });
            return () => {
                defaultMessagesSubscription.unsubscribe();
            };
        });
    }
}
exports.RxStompRPC = RxStompRPC;


/***/ }),

/***/ "./src/rx-stomp-state.ts":
/*!*******************************!*\
  !*** ./src/rx-stomp-state.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Possible states for the RxStomp
 *
 * Part of `@stomp/rx-stomp`
 */
var RxStompState;
(function (RxStompState) {
    RxStompState[RxStompState["CONNECTING"] = 0] = "CONNECTING";
    RxStompState[RxStompState["OPEN"] = 1] = "OPEN";
    RxStompState[RxStompState["CLOSING"] = 2] = "CLOSING";
    RxStompState[RxStompState["CLOSED"] = 3] = "CLOSED";
})(RxStompState = exports.RxStompState || (exports.RxStompState = {}));


/***/ }),

/***/ "./src/rx-stomp.ts":
/*!*************************!*\
  !*** ./src/rx-stomp.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const operators_1 = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
const stompjs_1 = __webpack_require__(/*! @stomp/stompjs */ "@stomp/stompjs");
const rx_stomp_state_1 = __webpack_require__(/*! ./rx-stomp-state */ "./src/rx-stomp-state.ts");
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


/***/ }),

/***/ 0:
/*!****************************!*\
  !*** multi ./src/index.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/kdeepak/MyWork/Tech/stomp/rx-stomp/src/index.ts */"./src/index.ts");


/***/ }),

/***/ "@stomp/stompjs":
/*!*******************************************************************************************************************!*\
  !*** external {"commonjs":"@stomp/stompjs","commonjs2":"@stomp/stompjs","amd":"@stomp/stompjs","root":"StompJs"} ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__stomp_stompjs__;

/***/ }),

/***/ "rxjs":
/*!************************************************************************************!*\
  !*** external {"root":["rxjs"],"commonjs":"rxjs","commonjs2":"rxjs","amd":"rxjs"} ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_rxjs__;

/***/ }),

/***/ "rxjs/operators":
/*!******************************************************************************************************************************!*\
  !*** external {"root":["rxjs","operators"],"commonjs":"rxjs/operators","commonjs2":"rxjs/operators","amd":"rxjs/operators"} ***!
  \******************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_rxjs_operators__;

/***/ })

/******/ });
});
//# sourceMappingURL=rx-stomp.umd.js.map