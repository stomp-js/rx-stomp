import { debugFnType, IFrame, StompHeaders, Versions } from '@stomp/stompjs';
import { RxStomp } from './rx-stomp.js';
/**
 * Represents a configuration object for RxSTOMP.
 * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
 *
 * All the attributes of these calls are optional.
 *
 * Part of `@stomp/rx-stomp`
 */
export declare class RxStompConfig {
    /**
     * The URL for the STOMP broker to connect to.
     * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
     *
     * Only one of this or [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} need to be set.
     * If both are set, [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} will be used.
     *
     * Maps to: [Client#brokerURL]{@link Client#brokerURL}
     */
    brokerURL?: string;
    /**
     * STOMP versions to attempt during STOMP handshake. By default, versions `1.2`, `1.1`, and `1.0` are attempted.
     *
     * Example:
     * ```javascript
     *        // Try only versions 1.1 and 1.0
     *        rxStompConfig.stompVersions= new Versions(['1.1', '1.0']);
     * ```
     *
     * Maps to: [Client#stompVersions]{@link Client#stompVersions}
     */
    stompVersions?: Versions;
    /**
     * Set it to log the actual raw communication with the broker.
     * When unset, it logs only the headers of the parsed frames.
     *
     * Change in this takes effect from the next broker reconnection.
     *
     * **Caution: this assumes that frames only have valid UTF8 strings.**
     *
     * Maps to: [Client#logRawCommunication]{@link Client#logRawCommunication}.
     */
    logRawCommunication?: boolean;
    /**
     * Enable client debugging
     *
     * Example:
     *
     * ```typescript
     *     debug: (msg: string): void => {
     *       console.log(new Date(), msg);
     *     },
     * ```
     */
    debug?: debugFnType;
    /**
     * This function should return a WebSocket or a similar (e.g. SockJS) object.
     * If your STOMP Broker supports WebSockets, prefer setting [Client#brokerURL]{@link Client#brokerURL}.
     *
     * If both this and [Client#brokerURL]{@link Client#brokerURL} are set, this will be used.
     *
     * Example:
     * ```javascript
     *        // use a WebSocket
     *        rxStompConfig.webSocketFactory= function () {
     *          return new WebSocket("wss://broker.329broker.com:15674/ws");
     *        };
     *
     *        // Typical usage with SockJS
     *        rxStompConfig.webSocketFactory= function () {
     *          return new SockJS("http://broker.329broker.com/stomp");
     *        };
     * ```
     *
     * Maps to: [Client#webSocketFactory]{@link Client#webSocketFactory}
     */
    webSocketFactory?: () => any;
    /**
     * Will retry if Stomp connection is not established in specified milliseconds.
     * Default 0, which implies wait forever.
     *
     * Maps to: [Client#connectionTimeout]{@link Client#connectionTimeout}.
     *
     * Caution: This feature is experimental.
     */
    connectionTimeout?: number;
    /**
     * Automatically reconnect with delay in milliseconds, set to 0 to disable.
     *
     * Maps to: [Client#reconnectDelay]{@link Client#reconnectDelay}
     */
    reconnectDelay?: number;
    /**
     * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
     *
     * Maps to: [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
     */
    heartbeatIncoming?: number;
    /**
     * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
     *
     * Maps to: [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}
     */
    heartbeatOutgoing?: number;
    /**
     * Enable a non-standards compliant mode of splitting outgoing large text packets.
     * See [Client#splitLargeFrames]{@link Client#splitLargeFrames} for details.
     * Probably, only Java Spring based brokers support this mode.
     *
     * Maps to: [Client#splitLargeFrames]{@link Client#splitLargeFrames}.
     */
    splitLargeFrames?: boolean;
    /**
     * Maps to: [Client#forceBinaryWSFrames]{@link Client#forceBinaryWSFrames}.
     */
    forceBinaryWSFrames?: boolean;
    /**
     * See [Client#appendMissingNULLonIncoming]{@link Client#appendMissingNULLonIncoming}.
     */
    appendMissingNULLonIncoming?: boolean;
    /**
     * Maps to: [Client#maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
     */
    maxWebSocketChunkSize?: number;
    /**
     * Maps to: [Client#discardWebsocketOnCommFailure]{@link Client#discardWebsocketOnCommFailure}.
     */
    discardWebsocketOnCommFailure?: boolean;
    /**
     * Connection headers, important keys - `login`, `passcode`, `host`.
     * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
     * details specific to your broker.
     *
     * Maps to: [Client#connectHeaders]{@link Client#connectHeaders}
     */
    connectHeaders?: StompHeaders;
    /**
     * Disconnection headers.
     *
     * Maps to: [Client#disconnectHeaders]{@link Client#disconnectHeaders}
     */
    disconnectHeaders?: StompHeaders;
    /**
     * Callback, invoked before attempting connection to the STOMP broker.
     *
     * You can change the configuration of the rxStomp, which will impact the immediate connecting.
     * It is valid to call [RxStomp#deactivate]{@link RxStomp#deactivate} in this callback.
     *
     * As of version 0.1.1, this callback can be
     * [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
     * (i.e., it can return a
     * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
     * In that case, connect will be called only after the Promise is resolved.
     * This can be used to reliably fetch credentials, access token etc. from some other service
     * in an asynchronous way.
     *
     * As of 0.3.5, this callback will receive [RxStomp]{@link RxStomp} as parameter.
     *
     * Maps to: [Client#beforeConnect]{@link Client#beforeConnect}
     */
    beforeConnect?: (client: RxStomp) => void | Promise<void>;
    /**
     * Callback invoked on every ERROR frame. If the callback returns the ID of a currently
     * subscribed destination, the frame will be emitted as an error on the corresponding
     * observable(s), terminating them.
     *
     * Importantly, since those observables are now closed, this means a re-SUBSCRIBE to
     * the erroneous destination will _not_ be attempted during an automatic reconnection of
     * the websocket.
     */
    correlateErrors?: (error: IFrame) => string;
}
