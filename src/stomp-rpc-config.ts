import { Observable } from "rxjs";
import { Message } from "@stomp/stompjs";
import {RxStomp} from "./rx-stomp";

/**
 * See the guide for example
 */
export type setupReplyQueueFnType = (replyQueueName: string, stompService: RxStomp) => Observable<Message>;

/**
 * RPC Config. See the guide for example.
 */
export class StompRPCConfig {
  /**
   * Name of the reply queue
   */
  replyQueueName?: string;
  /**
   * Setup the reply queue
   */
  setupReplyQueue?: setupReplyQueueFnType;
}
