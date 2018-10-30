import {StompHeaders} from '@stomp/stompjs';

import {IFrame} from './i-frame';

/**
 * Many callbacks/Observables return instance of a Message.
 * It has been created as an interface to avoid type compatibility issues.
 * Typescript does not consider two Objects to be of compatible types if these differ in private fields.
 */
export interface IMessage extends IFrame {
  /**
   * When subscribing with manual acknowledgement, call this method on the message to ACK the message.
   *
   * See [Client#ack]{@link Client#ack} for an example.
   */
  ack: (headers?: StompHeaders) => void;

  /**
   * When subscribing with manual acknowledgement, call this method on the message to NACK the message.
   *
   * See [Client#nack]{@link Client#nack} for an example.
   */
  nack: (headers?: StompHeaders) => void;
}
