import { IPublishParams } from '@stomp/stompjs';
/**
 * Additional options for [RxStomp#publish]{@link RxStomp#publish}.
 *
 * These options extend the base STOMP publish parameters with client-side
 * behavior that is specific to RxStomp.
 *
 * Part of `@stomp/rx-stomp`
 */
export interface IRxStompPublishParams extends IPublishParams {
    /**
     * When `true`, if the client is disconnected at publish time, the message
     * is queued locally and will be sent automatically after reconnection.
     *
     * Notes:
     * - Ordering is preserved among queued messages.
     * - Messages are kept in-memory only; they are not persisted across page reloads.
     * - If set to `false`, publish will be attempted immediately and will fail
     *   if there is no active connection.
     *
     * Default: `true`.
     */
    retryIfDisconnected?: boolean;
}
