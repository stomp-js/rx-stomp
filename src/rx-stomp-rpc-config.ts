import { Observable } from "rxjs";
import { Message } from "@stomp/stompjs";
import {RxStomp} from "./rx-stomp";

/**
 * See the guide for example
 */
export type setupReplyQueueFnType = (replyQueueName: string, rxStomp: RxStomp) => Observable<Message>;

/**
 * RPC Config. See the guide for example.
 */
export class RxStompRPCConfig {
  /**
   * Name of the reply queue
   */
  replyQueueName?: string;
  /**
   * Setup the reply queue
   */
  setupReplyQueue?: setupReplyQueueFnType;
}
