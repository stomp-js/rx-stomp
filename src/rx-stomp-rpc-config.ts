import { IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { RxStomp } from './rx-stomp.js';

/**
 * This is a Ninja-level topic.
 *
 * A factory function type used to create an Observable for the reply queue.
 *
 * Purpose
 * - RxStompRPC needs an Observable that emits all RPC replies. By default, it uses
 *   RxStomp.unhandledMessage$, which receives messages that don’t match any explicit subscription.
 * - Implement this to route replies from a dedicated queue or custom destination if your broker
 *   requires it.
 *
 * Parameters
 * - replyQueueName: The queue/destination where RPC replies should arrive.
 * - rxStomp: The active RxStomp instance (use it to set up any subscriptions you need).
 *
 * Return
 * - An Observable that emits every reply ({@link IMessage}) arriving on the reply queue.
 *
 * Notes
 * - The returned Observable should be “hot” (i.e., continue receiving frames without requiring
 *   downstream subscribers). If you return a cold Observable, RxStompRPC ensures it remains
 *   subscribed internally to keep the stream alive.
 * - The Observable must include all messages for the reply queue; RxStompRPC will filter replies
 *   per request using the correlation-id header.
 *
 * Example: use a dedicated temporary reply queue
 * ```typescript
 * const setupReplyQueue: setupReplyQueueFnType = (replyQueueName, rxStomp) => {
 *   // Ensure the broker delivers replies to `replyQueueName` for this session.
 *   // Then return a hot Observable of all messages from that destination.
 *   return rxStomp.watch({ destination: replyQueueName });
 * };
 * ```
 */
export type setupReplyQueueFnType = (
  replyQueueName: string,
  rxStomp: RxStomp,
) => Observable<IMessage>;

/**
 * This is a Ninja-level topic.
 *
 * Configuration and customization hooks for RxStomp RPC reply handling.
 *
 * For usage examples, see the guide:
 * /guide/rx-stomp/ng2-stompjs/remote-procedure-call.html
 */
export class RxStompRPCConfig {
  /**
   * Destination name for the reply queue used by RPC.
   *
   * Default: `/temp-queue/rpc-replies` — suitable for brokers like RabbitMQ and ActiveMQ that
   * support temporary or auto-named queues and route replies based on the `reply-to` header.
   *
   * When to customize:
   * - Your broker requires a different temporary-queue prefix/name.
   * - You prefer a dedicated, durable, or pre-provisioned reply destination.
   * - You want to isolate replies per application instance or user.
   */
  public replyQueueName?: string;

  /**
   * This is a Ninja-level topic.
   *
   * A hook to set up the reply queue and return an Observable of reply messages.
   *
   * Defaults to a function that uses RxStomp.unhandledMessage$, which is adequate when the broker
   * routes replies (via `reply-to`) to a temporary queue that doesn’t have an explicit subscription.
   *
   * Provide a custom implementation when:
   * - The broker requires an explicit subscription to the reply destination.
   * - You want to apply operators (e.g., share, retry) or diagnostics to the reply stream.
   *
   * Contract:
   * - Must return an Observable that emits every reply message ({@link IMessage}) received on
   *   the reply destination. RxStompRPC will filter messages by `correlation-id`.
   * - The Observable should remain active across reconnects or be resilient to resubscription.
   */
  public setupReplyQueue?: setupReplyQueueFnType;
}
