import { StompHeaders } from '@stomp/stompjs';
/**
 * Options for [RxStomp#watch]{@link RxStomp#watch}.
 *
 * Part of `@stomp/rx-stomp`
 */
export interface IWatchParams {
    /**
     * The subscription target. It is likely to be broker dependent.
     */
    readonly destination?: string;
    /**
     * Subscription headers, defaults to `{}`
     *
     * If header information can change over time and you are allowing automatic resubscriptions,
     * consider using a callback as the value rather than a string literal.
     *
     * ```typescript
     *              const subHeadersCallback = () => {
     *                  return {bye: 'world'};
     *              };
     *              const sub = rxStomp.watch({ destination: queueName, subHeaders: subHeadersCallback})
     *                                 .subscribe((message) => {
     *                                    // handle message
     *                                 });
     *              // The subHeadersCallback will be invoked before every (re)subscription.
     * ```
     */
    readonly subHeaders?: StompHeaders | (() => StompHeaders);
    /**
     * Headers to be passed while unsubscribing, defaults to `{}`.
     *
     * Occasionally, headers may not be known while invoking [RxStomp#watch]{@link RxStomp#watch},
     * in such cases a callback can be passed that would return the headers.
     *
     * ```typescript
     *              const unsubHeadersCallback = () => {
     *                  return {bye: 'world'};
     *              };
     *              const sub = rxStomp.watch({ destination: queueName, unsubHeaders: unsubHeadersCallback})
     *                                 .subscribe((message) => {
     *                                    // handle message
     *                                 });
     *              // Unsubscribe from RxJS Observable, internally unsubscribe will be issued to the broker.
     *              // `unsubHeadersCallback` will be invoked to get the headers.
     *              sub.unsubscribe();
     * ```
     */
    readonly unsubHeaders?: StompHeaders | (() => StompHeaders);
    /**
     * By default, the destination will be subscribed after each successful (re)connection to the broker.
     * Set this flag to not automatically resubscribe.
     */
    readonly subscribeOnlyOnce?: boolean;
}
