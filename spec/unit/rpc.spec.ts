// Tests under 'RPC' group are likely to fail on any broker other than RabbitMQ
// The tests under 'Custom Queue RPC' should work on every broker

import 'jasmine';

import { Message } from '@stomp/stompjs';
import { v4 as uuid } from 'uuid';

import { RxStomp, RxStompRPC } from '../../src';

import { generateBinaryData } from '../helpers/content-helpers';
import { ensureRxStompConnected, wait } from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';
import { firstValueFrom } from 'rxjs';

const myRPCEndPoint = '/topic/echo';

let rxStomp: RxStomp;
let rxStompRPC: RxStompRPC;

const startRPCServer = async () => {
  const receiptId = uuid();

  rxStomp
    .watch(myRPCEndPoint, { receipt: receiptId })
    .subscribe((message: Message) => {
      const replyTo = message.headers['reply-to'];
      const correlationId = message.headers['correlation-id'];
      const incomingMessage = message.binaryBody;

      rxStomp.publish({
        destination: replyTo,
        binaryBody: incomingMessage,
        headers: { 'correlation-id': correlationId },
      });
    });

  return new Promise<void>((resolve, reject) => {
    rxStomp.watchForReceipt(receiptId, () => {
      resolve();
    });
  });
};

const rpcCallHelper = (message: string): Promise<Message> =>
  firstValueFrom(rxStompRPC.rpc({ destination: myRPCEndPoint, body: message }));

const simpleRPCRetestTest = async () => {
  const msg01 = 'Hello';

  const reply01 = await rpcCallHelper(msg01);
  expect(reply01.body).toEqual(msg01);
};

const multiRPCRetestsTest = async () => {
  const msg01 = 'Hello';
  const msg02 = 'World';
  const msg03 = 'Hello World';

  const reply01 = await rpcCallHelper(msg01);
  expect(reply01.body).toEqual(msg01);

  const reply02 = await rpcCallHelper(msg02);
  expect(reply02.body).toEqual(msg02);

  const reply03 = await rpcCallHelper(msg03);
  expect(reply03.body).toEqual(msg03);
};

const rpcWithCustomCorrelationId = async () => {
  const msg = 'Hello';
  const customCorrelationId = `custom-${uuid()}`;
  const headers = { 'correlation-id': customCorrelationId };

  const reply = await firstValueFrom(
    rxStompRPC.rpc({ destination: myRPCEndPoint, body: msg, headers })
  );
  expect(reply.body).toEqual(msg);
  expect(reply.headers['correlation-id']).toEqual(customCorrelationId);
};

const rpcWithBinayPayload = async () => {
  const binaryMsg = generateBinaryData(1);
  const message = await firstValueFrom(
    rxStompRPC.rpc({ destination: myRPCEndPoint, binaryBody: binaryMsg })
  );
  expect(message.binaryBody.toString()).toEqual(binaryMsg.toString());
};

describe('RPC', () => {
  // Wait till RxStomp is actually connected
  beforeAll(async () => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp);
    await ensureRxStompConnected(rxStomp);
  });

  beforeAll(startRPCServer);

  it('Simple RPC', simpleRPCRetestTest);
  it('Multiple RPC requests', multiRPCRetestsTest);
  it('RPC with custom correlation-id', rpcWithCustomCorrelationId);
  it('RPC with binary payload', rpcWithBinayPayload);

  it('Should not leak', async () => {
    const numSubscribers = () => {
      // `.observers` is deprecated, as it is an internal implementation detail.
      // There is no equivalent. We will drop this test when this stops working.
      return rxStomp.unhandledMessage$.observers.length;
    };

    const origNumSubscribers = numSubscribers();

    const messagePromise = firstValueFrom(
      rxStompRPC.rpc({ destination: myRPCEndPoint, body: 'Hello' })
    );

    // Just after initiating the request, teh count should go up by 1
    expect(numSubscribers()).toBe(origNumSubscribers + 1);

    // After receiving the response, the count should go back
    await messagePromise;
    await wait(0);
    expect(numSubscribers()).toBe(origNumSubscribers);
  });
});

describe('Custom Queue RPC', () => {
  const stompRPCConfig = {
    // A name unique across all clients
    replyQueueName: `/queue/replies-${uuid()}`,

    // Simply subscribe, you would need to secure by adding broker specific options
    setupReplyQueue: (replyQueueName: string, rxStomp1: RxStomp) => {
      return rxStomp1.watch(replyQueueName, {
        durable: 'false',
        'auto-delete': 'true',
        exclusive: 'true',
      });
    },
  };

  // Wait till RxStomp is actually connected
  beforeAll(async () => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp, stompRPCConfig);
    await ensureRxStompConnected(rxStomp);
  });

  beforeAll(startRPCServer);

  it('Simple RPC', simpleRPCRetestTest);
  it('Multiple RPC requests', multiRPCRetestsTest);
  it('RPC with custom correlation-id', rpcWithCustomCorrelationId);
  it('RPC with binary payload', rpcWithBinayPayload);
});
