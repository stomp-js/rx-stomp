import {debugFnType, StompHeaders, Versions} from '@stomp/stompjs';

/**
 * Represents a configuration object for RxSTOMP.
 * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
 *
 * All the attributes of this calls are optional.
 *
 * Prat of `@stomp/rx-stomp`
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
   *  automatically reconnect with delay in milliseconds, set to 0 to disable.
   *
   * Maps to: [Client#reconnectDelay]{@Client#reconnectDelay}
   */
  public reconnectDelay?: number;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatIncoming]{@Client#heartbeatIncoming}
   */
  public heartbeatIncoming?: number;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}
   */
  public heartbeatOutgoing?: number;

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
   * It is valid to call [RxStomp#decativate]{@link RxStomp#deactivate} in this callback.
   *
   * As of version 0.1.1, this callback can be
   * [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
   * (i.e., it can return a
   * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
   * In that case connect will be called only after the Promise is resolved.
   * This can be used to reliably fetch credentials, access token etc. from some other service
   * in an asynchronous way.
   *
   * Maps to: [Client#beforeConnect]{@link Client#beforeConnect}
   */
  public beforeConnect?: () => void|Promise<void>;
}
