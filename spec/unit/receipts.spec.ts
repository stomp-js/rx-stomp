import { test, expect } from '@playwright/test';

import { firstValueFrom, TimeoutError } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { RxStomp } from '../../src/index.js';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
} from '../helpers/helpers.js';
import { rxStompFactory } from '../helpers/rx-stomp-factory.js';

test.describe('Receipt', () => {
  let rxStomp!: RxStomp;
  let testId: string;

  // Wait till RxStomp is actually connected
  test.beforeEach(() => {
    testId = uuid().slice(0, 8);
    rxStomp = rxStompFactory();
  });

  // Disconnect and wait till it actually disconnects
  test.afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
  });

  async function sendReceiveWithReceipt() {
    const receiptTopic = `/topic/ng-demo-receipt-${testId}`;
    const msg = 'My very special message';

    const watchReceipt = 'watch-receipt';
    const publishReceipt = 'publish-receipt';

    // Subscribe with receipt request
    const retPromise = firstValueFrom(
      rxStomp.watch(receiptTopic, { receipt: watchReceipt }),
    );
    await rxStomp.asyncReceipt(watchReceipt);

    // Now publish to the same queue with receipt request
    const promisePublishReceipt = rxStomp.asyncReceipt(publishReceipt);
    rxStomp.publish({
      destination: receiptTopic,
      body: msg,
      headers: { receipt: publishReceipt },
    });
    await promisePublishReceipt;

    const message = await retPromise;
    expect(message.body).toBe(msg);
  }

  test('gets a receipt with established connection', async () => {
    // Wait till RxStomp is actually connected
    await ensureRxStompConnected(rxStomp);
    await sendReceiveWithReceipt();
  });

  test('gets a receipt for activities before establishing a connection', async () => {
    await sendReceiveWithReceipt();
  });

  test.describe('asyncReceipt with timeout', () => {
    test('resolves when the receipt arrives before the timeout', async () => {
      const timeoutTopic = `/topic/timeout-test-${testId}`;
      await ensureRxStompConnected(rxStomp);

      const receiptId = 'timeout-receipt-ok';
      const receiptPromise = rxStomp.asyncReceipt(receiptId, 5000);

      rxStomp.publish({
        destination: timeoutTopic,
        body: 'test',
        headers: { receipt: receiptId },
      });

      await receiptPromise;
    });

    test('rejects with TimeoutError when no receipt arrives within the timeout', async () => {
      await ensureRxStompConnected(rxStomp);

      const receiptPromise = rxStomp.asyncReceipt(
        'receipt-that-never-comes',
        100,
      );

      await expect(receiptPromise).rejects.toThrow(TimeoutError);
    });
  });
});
