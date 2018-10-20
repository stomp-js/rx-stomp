// These are likely to fail on any broker other than RabbitMQ

import "jasmine";

import { defaultConfig, MyStompRService } from '../helpers/stomp.service.factory';
import { ensureStompConnected } from '../helpers/helpers';
import { Message } from '@stomp/stompjs';
import { UUID } from 'angular2-uuid';
import { RxStompRPC, RxStomp } from "../../src";

describe('Rabbit RPC', () => {
  const myServiceEndPoint = '/topic/echo';

  let stompService: RxStomp;
  let stompRPCService: RxStompRPC;
  const stompConfig = defaultConfig();

  // Wait till STOMP Service is actually connected
  beforeAll(() => {
    stompService = new MyStompRService();
    stompService.config = stompConfig;
    stompService.initAndConnect();
    stompRPCService = new RxStompRPC(stompService);
  });

  // Wait till STOMP Service is actually connected
  beforeAll((done) => {
    ensureStompConnected(stompService, done);
  });

  beforeAll((done) => {
    const receiptId = UUID.UUID();

    stompService.subscribe(myServiceEndPoint, {receipt: receiptId}).subscribe((message: Message) => {
      const replyTo = message.headers['reply-to'];
      const correlationId = message.headers['correlation-id'];
      const incomingMessage = message.body;

      const outgoingMessage = 'Echoing - ' + incomingMessage;
      stompService.publish(replyTo, outgoingMessage, {'correlation-id' : correlationId});
    });

    stompService.waitForReceipt(receiptId, () => {
      done();
    });
  });

  it('Simple RPC', (done) => {
    // Watch for RPC response
    stompRPCService.rpc(myServiceEndPoint, 'Hello').subscribe((message: Message) => {
      expect(message.body).toBe('Echoing - Hello');
      done();
    });
  });

  it('Should not leak', (done) => {
    let numSubscribers = () => {
      return stompService.defaultMessagesObservable.observers.length;
    };

    let origNumSubcribers = numSubscribers();

    // Watch for RPC response
    stompRPCService.rpc(myServiceEndPoint, 'Hello').subscribe((message: Message) => {
      expect(message.body).toBe('Echoing - Hello');
      setTimeout(() => {
        expect(numSubscribers()).toBe(origNumSubcribers);
        done();
      }, 0);
    });

    expect(numSubscribers()).toBe(origNumSubcribers + 1);
  });

});
