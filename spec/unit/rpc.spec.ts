// These are likely to fail on any broker other than RabbitMQ
// Works with ActiveMQ, with special init function

import 'jasmine';

import { Message } from '@stomp/stompjs';
import { UUID } from 'angular2-uuid';

import { RxStomp, RxStompRPC } from '../../src';

import { generateBinaryData } from '../helpers/content-helpers';
import { ensureRxStompConnected } from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('RPC', () => {
  const myRPCEndPoint = '/topic/echo';

  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;

  // Wait till RxStomp is actually connected
  beforeAll((done) => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp);
    ensureRxStompConnected(rxStomp, done);
  });

  beforeAll((done) => {
    const receiptId = UUID.UUID();

    rxStomp.watch(myRPCEndPoint, {receipt: receiptId}).subscribe((message: Message) => {
      const replyTo = message.headers['reply-to'];
      const correlationId = message.headers['correlation-id'];
      const incomingMessage = message.binaryBody;

      rxStomp.publish({
        destination: replyTo,
        binaryBody: incomingMessage,
        headers: {'correlation-id': correlationId}
      });
    });

    rxStomp.waitForReceipt(receiptId, () => {
      done();
    });
  });

  it('Simple RPC', (done) => {
    // Watch for RPC response

    const msg = 'Hello';
    rxStompRPC.rpc({destination: myRPCEndPoint, body: msg}).subscribe((message: Message) => {
      expect(message.body).toEqual(msg);
      done();
    });
  });

  it('RPC with binary payload', (done) => {
    // Watch for RPC response

    const binaryMsg = generateBinaryData(1);
    rxStompRPC.rpc({destination: myRPCEndPoint, binaryBody: binaryMsg}).subscribe((message: Message) => {
      expect(message.binaryBody.toString()).toEqual(binaryMsg.toString());
      done();
    });
  });

  it('Should not leak', (done) => {
    const numSubscribers = () => {
      return rxStomp.unhandledMessage$.observers.length;
    };

    const origNumSubcribers = numSubscribers();

    const msg = 'Hello';
    // Watch for RPC response
    rxStompRPC.rpc({destination: myRPCEndPoint, body: msg}).subscribe((message: Message) => {
      expect(message.body).toEqual(msg);
      setTimeout(() => {
        expect(numSubscribers()).toBe(origNumSubcribers);
        done();
      }, 0);
    });

    expect(numSubscribers()).toBe(origNumSubcribers + 1);
  });

});
