import { StompHeaders } from '@stomp/stompjs';
/**
 * Options for [RxStomp#watch]{@link RxStomp#watch}.
 *
 * These parameters control how a subscription is created, re-created on reconnects,
 * and how headers are supplied both during subscribe and unsubscribe.
 *
 * Part of `@stomp/rx-stomp`
 */
export interface IWatchParams {
    /**
     * The subscription target (destination). This is broker-specific and typically
     * looks like a queue or a topic, e.g. `/queue/orders` or `/topic/updates`.
     */
    readonly destination?: string;
    /**
     * Headers to send with the SUBSCRIBE frame. Defaults to `{}`.
     *
     * If header values may change across reconnects, supply a function that will be
     * invoked before each (re)subscription so it can return the latest headers.
     *
     * Example:
     * ```typescript
     * const subHeadersCallback = () => ({ Authorization: `Bearer ${getToken()}` });
     * const sub = rxStomp.watch({ destination: queueName, subHeaders: subHeadersCallback })
     *   .subscribe(message => { /* handle message *\/ });
     * // The function runs before every subscription and resubscription.
     * ```
     */
    readonly subHeaders?: StompHeaders | (() => StompHeaders);
    /**
     * Headers to send with the UNSUBSCRIBE frame. Defaults to `{}`.
     *
     * When headers are not known up-front, pass a function that will be invoked
     * right before unsubscribing to obtain the current headers.
     *
     * Example:
     * ```typescript
     * const unsubHeadersCallback = () => ({ reason: 'user-navigation' });
     * const sub = rxStomp.watch({ destination: queueName, unsubHeaders: unsubHeadersCallback })
     *   .subscribe(message => { /* handle message *\/ });
     * // Later:
     * sub.unsubscribe(); // The callback will be invoked to fetch headers.
     * ```
     */
    readonly unsubHeaders?: StompHeaders | (() => StompHeaders);
    /**
     * By default, the destination will be re-subscribed automatically after each
     * successful reconnection. Set to `true` to subscribe only once and suppress
     * automatic resubscriptions.
     *
     * This is useful for one-off streams or when you prefer to control the lifetime
     * explicitly across reconnects.
     */
    readonly subscribeOnlyOnce?: boolean;
}
