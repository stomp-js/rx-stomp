import { debugFnType, IFrame, StompHeaders, Versions } from '@stomp/stompjs';
import { RxStomp } from './rx-stomp.js';

/**
 * Represents a configuration object for RxSTOMP.
 * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
 *
 * All the attributes of this calls are optional.
 *
 * Part of `@stomp/rx-stomp`
 */
export class RxStompConfig {
  /**
   * The URL for the STOMP broker to connect to.
   * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
   *
   * Only one of this or [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} need to be set.
   * If both are set, [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} will be used.
   *
   * Maps to: [Client#brokerURL]{@link Client#brokerURL}
   */
  public brokerURL?: string;

  /**
   * STOMP versions to attempt during STOMP handshake. By default versions `1.0`, `1.1`, and `1.2` are attempted.
   *
   * Example:
   * ```javascript
   *        // Try only versions 1.0 and 1.1
   *        rxStompConfig.stompVersions= new Versions(['1.0', '1.1']);
   * ```
   *
   * Maps to: [Client#stompVersions]{@link Client#stompVersions}
   */
  public stompVersions?: Versions;

  /**
   * Set it to log the actual raw communication with the broker.
   * When unset, it logs headers of the parsed frames.
   *
   * Change in this effects from next broker reconnect.
   *
   * **Caution: this assumes that frames only have valid UTF8 strings.**
   *
   * Maps to: [Client#logRawCommunication]{@link Client#logRawCommunication}.
   */
  public logRawCommunication?: boolean;

  /** Enable client debugging? */
  public debug?: debugFnType;

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
  public webSocketFactory?: () => any;

  /**
   * Will retry if Stomp connection is not established in specified milliseconds.
   * Default 0, which implies wait for ever.
   *
   * Maps to: [Client#connectionTimeout]{@link Client#connectionTimeout}.
   */
  public connectionTimeout?: number;

  /**
   * Automatically reconnect with delay in milliseconds, set to 0 to disable.
   *
   * Maps to: [Client#reconnectDelay]{@link Client#reconnectDelay}
   */
  public reconnectDelay?: number;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
   */
  public heartbeatIncoming?: number;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}
   */
  public heartbeatOutgoing?: number;

  /**
   * Enable non-standards compliant mode of splitting of outgoing large text packets.
   * See [Client#splitLargeFrames]{@link Client#splitLargeFrames} for details.
   * Useful with Java Spring based brokers.
   *
   * Maps to: [Client#splitLargeFrames]{@link Client#splitLargeFrames}.
   */
  public splitLargeFrames?: boolean;

  /**
   * Maps to: [Client#forceBinaryWSFrames]{@link Client#forceBinaryWSFrames}.
   */
  public forceBinaryWSFrames?: boolean;

  /**
   * See [Client#appendMissingNULLonIncoming]{@link Client#appendMissingNULLonIncoming}.
   */
  public appendMissingNULLonIncoming?: boolean;

  /**
   * Maps to: [Client#maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
   */
  public maxWebSocketChunkSize?: number;

  /**
   * Maps to: [Client#discardWebsocketOnCommFailure]{@link Client#discardWebsocketOnCommFailure}.
   */
  public discardWebsocketOnCommFailure?: boolean;

  /**
   * Connection headers, important keys - `login`, `passcode`, `host`.
   * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
   * details specific to your broker.
   *
   * Maps to: [Client#connectHeaders]{@link Client#connectHeaders}
   */
  public connectHeaders?: StompHeaders;

  /**
   * Disconnection headers.
   *
   * Maps to: [Client#disconnectHeaders]{@link Client#disconnectHeaders}
   */
  public disconnectHeaders?: StompHeaders;

  /**
   * Callback, invoked on before a connection connection to the STOMP broker.
   *
   * You can change configuration of the rxStomp, which will impact the immediate connect.
   * It is valid to call [RxStomp#deactivate]{@link RxStomp#deactivate} in this callback.
   *
   * As of version 0.1.1, this callback can be
   * [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
   * (i.e., it can return a
   * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
   * In that case connect will be called only after the Promise is resolved.
   * This can be used to reliably fetch credentials, access token etc. from some other service
   * in an asynchronous way.
   *
   * As of 0.3.5, this callback will receive [RxStomp]{@link RxStomp} as parameter.
   *
   * Maps to: [Client#beforeConnect]{@link Client#beforeConnect}
   */
  public beforeConnect?: (client: RxStomp) => void | Promise<void>;

  /**
   * Callback invoked on every ERROR frame. If the callback returns the ID of a currently
   * subscribed destination, the frame will be emitted as an error on the corresponding
   * observable(s), terminating them.
   *
   * Importantly, since those observables are now closed, this means a re-SUBSCRIBE to
   * the erroneous destination will _not_ be attempted during an automatic reconnection of
   * the websocket.
   */
  public correlateErrors?: (error: IFrame) => string;
}
