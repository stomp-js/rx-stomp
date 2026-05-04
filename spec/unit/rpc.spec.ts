// Tests under 'RPC' group are likely to fail on any broker other than RabbitMQ
// The tests under 'Custom Queue RPC' should work on every broker

import { test, expect } from '@playwright/test';

import { IMessage, RxStomp, RxStompRPC } from '../../src/index.js';
import { v4 as uuid } from 'uuid';

import { generateBinaryData } from '../helpers/content-helpers.js';
import { ensureRxStompConnected, wait } from '../helpers/helpers.js';
import { rxStompFactory } from '../helpers/rx-stomp-factory.js';
import { firstValueFrom } from 'rxjs';

const startRPCServer = async (rxStomp: RxStomp, endpoint: string) => {
  const receiptId = uuid();

  rxStomp
    .watch(endpoint, { receipt: receiptId })
    .subscribe((message: IMessage) => {
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

const rpcCallHelper = (
  rxStompRPC: RxStompRPC,
  endpoint: string,
  message: string,
): Promise<IMessage> =>
  firstValueFrom(rxStompRPC.rpc({ destination: endpoint, body: message }));

const simpleRPCRetestTest = async (
  rxStompRPC: RxStompRPC,
  endpoint: string,
) => {
  const msg01 = 'Hello';
  const reply01 = await rpcCallHelper(rxStompRPC, endpoint, msg01);
  expect(reply01.body).toEqual(msg01);
};

const multiRPCRetestsTest = async (
  rxStompRPC: RxStompRPC,
  endpoint: string,
) => {
  const msg01 = 'Hello';
  const msg02 = 'World';
  const msg03 = 'Hello World';

  const reply01 = await rpcCallHelper(rxStompRPC, endpoint, msg01);
  expect(reply01.body).toEqual(msg01);

  const reply02 = await rpcCallHelper(rxStompRPC, endpoint, msg02);
  expect(reply02.body).toEqual(msg02);

  const reply03 = await rpcCallHelper(rxStompRPC, endpoint, msg03);
  expect(reply03.body).toEqual(msg03);
};

const rpcWithCustomCorrelationId = async (
  rxStompRPC: RxStompRPC,
  endpoint: string,
) => {
  const msg = 'Hello';
  const customCorrelationId = `custom-${uuid()}`;
  const headers = { 'correlation-id': customCorrelationId };

  const reply = await firstValueFrom(
    rxStompRPC.rpc({ destination: endpoint, body: msg, headers }),
  );
  expect(reply.body).toEqual(msg);
  expect(reply.headers['correlation-id']).toEqual(customCorrelationId);
};

const rpcWithBinaryPayload = async (
  rxStompRPC: RxStompRPC,
  endpoint: string,
) => {
  const binaryMsg = generateBinaryData(1);
  const message = await firstValueFrom(
    rxStompRPC.rpc({ destination: endpoint, binaryBody: binaryMsg }),
  );
  expect(message.binaryBody.toString()).toEqual(binaryMsg.toString());
};

test.describe('RPC', () => {
  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;
  let myRPCEndPoint: string;

  test.beforeEach(async () => {
    myRPCEndPoint = `/topic/echo-${uuid().slice(0, 8)}`;
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp);
    await ensureRxStompConnected(rxStomp);
    await startRPCServer(rxStomp, myRPCEndPoint);
  });

  test.afterEach(async () => {
    await rxStomp.deactivate({ force: true });
  });

  test('Simple RPC', async () =>
    simpleRPCRetestTest(rxStompRPC, myRPCEndPoint));
  test('Multiple RPC requests', async () =>
    multiRPCRetestsTest(rxStompRPC, myRPCEndPoint));
  test('RPC with custom correlation-id', async () =>
    rpcWithCustomCorrelationId(rxStompRPC, myRPCEndPoint));
  test('RPC with binary payload', async () =>
    rpcWithBinaryPayload(rxStompRPC, myRPCEndPoint));

  test('Should not leak', async () => {
    const numSubscribers = () => {
      // `.observers` is deprecated, as it is an internal implementation detail.
      // There is no equivalent. We will drop this test when this stops working.
      return rxStomp.unhandledMessage$.observers.length;
    };

    const origNumSubscribers = numSubscribers();

    const messagePromise = firstValueFrom(
      rxStompRPC.rpc({ destination: myRPCEndPoint, body: 'Hello' }),
    );

    // Just after initiating the request, the count should go up by 1
    expect(numSubscribers()).toBe(origNumSubscribers + 1);

    // After receiving the response, the count should go back
    await messagePromise;
    await wait(0);
    expect(numSubscribers()).toBe(origNumSubscribers);
  });
});

test.describe('Custom Queue RPC', () => {
  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;
  let myRPCEndPoint: string;

  test.beforeEach(async () => {
    myRPCEndPoint = `/topic/echo-${uuid().slice(0, 8)}`;
    rxStomp = rxStompFactory();

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

    rxStompRPC = new RxStompRPC(rxStomp, stompRPCConfig);
    await ensureRxStompConnected(rxStomp);
    await startRPCServer(rxStomp, myRPCEndPoint);
  });

  test.afterEach(async () => {
    await rxStomp.deactivate({ force: true });
  });

  test('Simple RPC', async () =>
    simpleRPCRetestTest(rxStompRPC, myRPCEndPoint));
  test('Multiple RPC requests', async () =>
    multiRPCRetestsTest(rxStompRPC, myRPCEndPoint));
  test('RPC with custom correlation-id', async () =>
    rpcWithCustomCorrelationId(rxStompRPC, myRPCEndPoint));
  test('RPC with binary payload', async () =>
    rpcWithBinaryPayload(rxStompRPC, myRPCEndPoint));
});
