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
     * Possible states for the RxStomp
     *
     * Part of `@stomp/rx-stomp`
     */
    exports.RxStompState = void 0;
    (function (RxStompState) {
        RxStompState[RxStompState["CONNECTING"] = 0] = "CONNECTING";
        RxStompState[RxStompState["OPEN"] = 1] = "OPEN";
        RxStompState[RxStompState["CLOSING"] = 2] = "CLOSING";
        RxStompState[RxStompState["CLOSED"] = 3] = "CLOSED";
    })(exports.RxStompState = exports.RxStompState || (exports.RxStompState = {}));

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
         * @param stompClient optionally inject the
         * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
         * {@link Client} to wrap. If this is not provided, a client will
         * be constructed internally.
         */
        constructor(stompClient) {
            /**
             * Internal array to hold locally queued messages when STOMP broker is not connected.
             */
            this._queuedMessages = [];
            const client = stompClient ? stompClient : new stompjs.Client();
            this._stompClient = client;
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
        async deactivate(options = {}) {
            this._changeState(exports.RxStompState.CLOSING);
            // The promise will be resolved immediately if there is no active connection
            // otherwise, after it has successfully disconnected.
            await this._stompClient.deactivate(options);
            this._changeState(exports.RxStompState.CLOSED);
        }
        /**
         * It will return `true` if STOMP broker is connected and `false` otherwise.
         */
        connected() {
            return this.connectionState$.getValue() === exports.RxStompState.OPEN;
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
         *        const receipt = rxStomp.asyncReceipt(receiptId);
         *        rxStomp.publish({destination: '/topic/special', headers: {receipt: receiptId}, body: msg});
         *        await receipt; // it yields the actual Frame
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
     * RPC Config. For examples see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
     */
    class RxStompRPCConfig {
    }

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
         * Make an RPC request.
         * See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html) for example.
         *
         * It is a simple wrapper around [RxStompRPC#stream]{@link RxStompRPC#stream}.
         */
        rpc(params) {
            // We know there will be only one message in reply
            return this.stream(params).pipe(rxjs.first());
        }
        /**
         * Make an RPC stream request. See the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
         *
         * Note: This call internally takes care of generating a correlation id,
         * however, if `correlation-id` is passed via `headers`, that will be used instead.
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
                    // Cleanup
                    defaultMessagesSubscription.unsubscribe();
                };
            });
        }
    }

    Object.defineProperty(exports, 'StompHeaders', {
        enumerable: true,
        get: function () { return stompjs.StompHeaders; }
    });
    Object.defineProperty(exports, 'StompSocketState', {
        enumerable: true,
        get: function () { return stompjs.StompSocketState; }
    });
    Object.defineProperty(exports, 'Versions', {
        enumerable: true,
        get: function () { return stompjs.Versions; }
    });
    exports.RxStomp = RxStomp;
    exports.RxStompConfig = RxStompConfig;
    exports.RxStompRPC = RxStompRPC;
    exports.RxStompRPCConfig = RxStompRPCConfig;

}));
//# sourceMappingURL=rx-stomp.umd.js.map
