import { IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { RxStomp } from './rx-stomp.js';
/**
 * For examples see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
 *
 * Part of `@stomp/rx-stomp`
 */
export type setupReplyQueueFnType = (replyQueueName: string, rxStomp: RxStomp) => Observable<IMessage>;
/**
 * RPC Config. For examples see the [guide](/guide/rx-stomp/ng2-stompjs/remote-procedure-call.html).
 */
export declare class RxStompRPCConfig {
    /**
     * Name of the reply queue. See the guide for details.
     * Default `/temp-queue/rpc-replies` suitable for RabbitMQ and ActiveMQ.
     */
    replyQueueName?: string;
    /**
     * Setup the reply queue. See the guide for details.
     */
    setupReplyQueue?: setupReplyQueueFnType;
}
