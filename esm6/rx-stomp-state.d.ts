/**
 * Connection lifecycle states for RxStomp.
 *
 * These states reflect the status of the underlying STOMP-over-WebSocket connection
 * as well as the client's activation/deactivation lifecycle.
 *
 * Common usage:
 * ```typescript
 * rxStomp.connectionState$.subscribe((state) => {
 *   switch (state) {
 *     case RxStompState.CONNECTING:
 *       console.log('Attempting to connect...');
 *       break;
 *     case RxStompState.OPEN:
 *       console.log('Connected');
 *       break;
 *     case RxStompState.CLOSING:
 *       console.log('Disconnecting...');
 *       break;
 *     case RxStompState.CLOSED:
 *       console.log('Disconnected');
 *       break;
 *   }
 * });
 * ```
 *
 * Part of `@stomp/rx-stomp`
 */
export declare enum RxStompState {
    /**
     * A connection attempt is in progress. This includes the WebSocket opening
     * and the STOMP CONNECT handshake phase.
     */
    CONNECTING = 0,
    /**
     * The STOMP session is fully established and operational.
     * Messages can be published, and subscriptions will receive messages.
     */
    OPEN = 1,
    /**
     * A graceful shutdown has been requested and is underway.
     * New subscriptions/publishes should be avoided during this phase.
     */
    CLOSING = 2,
    /**
     * There is no active connection to the broker.
     * The client may be inactive or waiting to retry based on reconnection settings.
     */
    CLOSED = 3
}
