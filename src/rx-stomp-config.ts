import {
  debugFnType,
  IFrame,
  ReconnectionTimeMode,
  StompHeaders,
  TickerStrategy,
  Versions,
} from '@stomp/stompjs';
import { RxStomp } from './rx-stomp.js';

/**
 * Represents a configuration object for RxSTOMP.
 * Instance of this can be passed to [RxStomp#configure]{@link RxStomp#configure}
 *
 * All the attributes of these calls are optional.
 *
 * Part of `@stomp/rx-stomp`
 */
export class RxStompConfig {
  /**
   * The WebSocket URL of the STOMP broker endpoint.
   * Example: "ws://broker.domain.com:15674/ws" or "wss://broker.domain.com:15674/ws".
   *
   * Only one of this or [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} needs to be set.
   * If both are set, [RxStompConfig#webSocketFactory]{@link RxStompConfig#webSocketFactory} takes precedence.
   *
   * Maps to: [Client#brokerURL]{@link Client#brokerURL}
   */
  public brokerURL?: string;

  /**
   * STOMP versions to attempt during the handshake. By default, versions `1.2`, `1.1`, and `1.0` are attempted.
   *
   * Example:
   * ```typescript
   * // Try only versions 1.1 and 1.0
   * rxStompConfig.stompVersions = new Versions(['1.1', '1.0']);
   * ```
   *
   * Maps to: [Client#stompVersions]{@link Client#stompVersions}
   */
  public stompVersions?: Versions;

  /**
   * Enable logging of raw frames exchanged with the broker.
   * When unset or false, only parsed frame headers are logged.
   *
   * Takes effect from the next (re)connection.
   *
   * Caution: Assumes frames contain valid UTF-8 strings.
   *
   * Maps to: [Client#logRawCommunication]{@link Client#logRawCommunication}.
   */
  public logRawCommunication?: boolean;

  /**
   * Custom debug logger for library messages.
   *
   * Example:
   * ```typescript
   * rxStompConfig.debug = (msg: string) => {
   *   console.log(new Date(), msg);
   * };
   * ```
   *
   * Maps to: [Client#debug]{@link Client#debug}.
   */
  public debug?: debugFnType;

  /**
   * Factory function to create and return a WebSocket-like object (e.g., WebSocket or SockJS).
   * Prefer [Client#brokerURL]{@link Client#brokerURL} if your broker exposes a standard WebSocket endpoint.
   *
   * If both this and [Client#brokerURL]{@link Client#brokerURL} are set, this will be used.
   *
   * Example:
   * ```typescript
   * // Use a native WebSocket
   * rxStompConfig.webSocketFactory = () => new WebSocket('wss://broker.domain.com:15674/ws');
   *
   * // Use SockJS
   * rxStompConfig.webSocketFactory = () => new SockJS('https://broker.domain.com/stomp');
   * ```
   *
   * Maps to: [Client#webSocketFactory]{@link Client#webSocketFactory}
   */
  public webSocketFactory?: () => any;

  /**
   * Connection timeout in milliseconds; the attempt is aborted if not connected within this time.
   * Default: 0 (wait indefinitely).
   *
   * Maps to: [Client#connectionTimeout]{@link Client#connectionTimeout}.
   *
   * Caution: Experimental.
   */
  public connectionTimeout?: number;

  /**
   * Base delay (in milliseconds) between automatic reconnection attempts.
   * Set to 0 to disable auto-reconnect.
   *
   * Maps to: [Client#reconnectDelay]{@link Client#reconnectDelay}
   */
  public reconnectDelay?: number;
  /**
   * Maximum reconnection delay in milliseconds when using increasing reconnection strategies.
   * Ignored when [reconnectTimeMode]{@link RxStompConfig#reconnectTimeMode} is fixed/linear with a constant delay.
   *
   * Maps to: [Client#maxReconnectDelay]{@link Client#maxReconnectDelay}
   */
  public maxReconnectDelay?: number;

  /**
   * Strategy for spacing reconnection attempts.
   * - ReconnectionTimeMode.LINEAR: fixed delay equal to [reconnectDelay]{@link RxStompConfig#reconnectDelay}
   * - ReconnectionTimeMode.EXPONENTIAL: delay doubles after each attempt, capped by [maxReconnectDelay]{@link RxStompConfig#maxReconnectDelay}
   *
   * Maps to: [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}
   */
  public reconnectTimeMode?: ReconnectionTimeMode;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
   */
  public heartbeatIncoming?: number;

  /**
   * Multiplier applied to the incoming heartbeat interval to determine tolerance for missing heartbeats.
   * Effective tolerance = heartbeatIncoming * heartbeatToleranceMultiplier.
   *
   * Maps to: [Client#heartbeatToleranceMultiplier]{@link Client#heartbeatToleranceMultiplier}.
   */
  public heartbeatToleranceMultiplier?: number;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
   *
   * Maps to: [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}
   */
  public heartbeatOutgoing?: number;

  /**
   * Strategy/ticker used for scheduling heartbeats.
   *
   * Maps to: [Client#heartbeatStrategy]{@link Client#heartbeatStrategy}.
   */
  public heartbeatStrategy?: TickerStrategy;

  /**
   * Enable a non-standards-compliant mode of splitting large text WebSocket frames.
   * Useful for brokers that require chunked text frames (commonly certain Java Spring setups).
   * Binary frames are never split.
   *
   * Maps to: [Client#splitLargeFrames]{@link Client#splitLargeFrames}.
   */
  public splitLargeFrames?: boolean;

  /**
   * Force all WebSocket frames to be sent as binary.
   *
   * Maps to: [Client#forceBinaryWSFrames]{@link Client#forceBinaryWSFrames}.
   */
  public forceBinaryWSFrames?: boolean;

  /**
   * Workaround for environments where incoming frames may be truncated at NULL.
   * Appends a trailing NULL to incoming frames.
   *
   * Maps to: [Client#appendMissingNULLonIncoming]{@link Client#appendMissingNULLonIncoming}.
   */
  public appendMissingNULLonIncoming?: boolean;

  /**
   * Maximum size (in bytes) of each WebSocket chunk when [splitLargeFrames]{@link RxStompConfig#splitLargeFrames} is enabled.
   *
   * Maps to: [Client#maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
   */
  public maxWebSocketChunkSize?: number;

  /**
   * Immediately discard the WebSocket on communication failure, instead of waiting for a clean close.
   * Can reduce reconnection delays on certain browser/network failures.
   *
   * Maps to: [Client#discardWebsocketOnCommFailure]{@link Client#discardWebsocketOnCommFailure}.
   */
  public discardWebsocketOnCommFailure?: boolean;

  /**
   * Connection headers, common keys include `login`, `passcode`, and `host`.
   * Refer to your broker documentation for exact requirements.
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
   * Callback invoked before attempting a connection to the STOMP broker.
   *
   * You may update configuration or credentials within this callback.
   * It is valid to call [RxStomp#deactivate]{@link RxStomp#deactivate} here.
   *
   * This callback can be async; connection proceeds after the returned Promise resolves.
   * As of 0.3.5, this callback receives the [RxStomp]{@link RxStomp} instance.
   *
   * Maps to: [Client#beforeConnect]{@link Client#beforeConnect}
   */
  public beforeConnect?: (client: RxStomp) => void | Promise<void>;

  /**
   * Callback invoked on every ERROR frame from the broker.
   *
   * Return the subscription ID (or destination-id) that should receive the error. If returned ID
   * corresponds to an active subscription, that observable will error and complete, and will not be
   * re-subscribed automatically on reconnection.
   *
   * Useful for mapping broker ERROR frames to specific subscriptions that caused them.
   */
  public correlateErrors?: (error: IFrame) => string;
}
