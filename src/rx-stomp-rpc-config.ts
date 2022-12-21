import { IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { RxStomp } from './rx-stomp.js';

/**
 * See the guide for example
 *
 * Part of `@stomp/rx-stomp`
 */
export type setupReplyQueueFnType = (
  replyQueueName: string,
  rxStomp: RxStomp
) => Observable<IMessage>;

/**
 * RPC Config. See the guide for example.
 */
export class RxStompRPCConfig {
  /**
   * Name of the reply queue. See the guide for details.
   * Default `/temp-queue/rpc-replies` suitable for RabbitMQ and ActiveMQ.
   */
  public replyQueueName?: string;
  /**
   * Setup the reply queue. See the guide for details.
   */
  public setupReplyQueue?: setupReplyQueueFnType;
}
