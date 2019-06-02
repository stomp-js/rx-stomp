import { IPublishParams } from '@stomp/stompjs';
/**
 * Additional options for [RxStomp#publish]{@link RxStomp#publish}
 *
 * Part of `@stomp/rx-stomp`
 */
export interface IRxStompPublishParams extends IPublishParams {
    /**
     * When set to `true` message will be enqueued if the connection
     * to the broker is down.
     * Such messages will be published when connection is reestablished.
     *
     * Default is `true`.
     */
    retryIfDisconnected?: boolean;
}
