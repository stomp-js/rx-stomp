// These are likely to fail on any broker other than RabbitMQ
// Works with ActiveMQ, with special init function

import 'jasmine';

import { Message } from '@stomp/stompjs';
import { UUID } from 'angular2-uuid';

import { RxStomp, RxStompRPC } from '../../src';

import { ensureStompConnected } from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('RxStomp RPC', () => {
  const myRPCEndPoint = '/topic/echo';

  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;

  // Wait till RxStomp is actually connected
  beforeAll((done) => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp);
    ensureStompConnected(rxStomp, done);
  });

  beforeAll((done) => {
    const receiptId = UUID.UUID();

    rxStomp.subscribe(myRPCEndPoint, {receipt: receiptId}).subscribe((message: Message) => {
      const replyTo = message.headers['reply-to'];
      const correlationId = message.headers['correlation-id'];
      const incomingMessage = message.body;

      const outgoingMessage = 'Echoing - ' + incomingMessage;
      rxStomp.publish(replyTo, outgoingMessage, {'correlation-id' : correlationId});
    });

    rxStomp.waitForReceipt(receiptId, () => {
      done();
    });
  });

  it('Simple RPC', (done) => {
    // Watch for RPC response
    rxStompRPC.rpc(myRPCEndPoint, 'Hello').subscribe((message: Message) => {
      expect(message.body).toBe('Echoing - Hello');
      done();
    });
  });

  it('Should not leak', (done) => {
    const numSubscribers = () => {
      return rxStomp.defaultMessagesObservable.observers.length;
    };

    const origNumSubcribers = numSubscribers();

    // Watch for RPC response
    rxStompRPC.rpc(myRPCEndPoint, 'Hello').subscribe((message: Message) => {
      expect(message.body).toBe('Echoing - Hello');
      setTimeout(() => {
        expect(numSubscribers()).toBe(origNumSubcribers);
        done();
      }, 0);
    });

    expect(numSubscribers()).toBe(origNumSubcribers + 1);
  });

});
