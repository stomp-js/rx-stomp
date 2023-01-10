/* tslint:disable:no-unused-variable */

import "jasmine";

import { firstValueFrom } from "rxjs";

import { RxStomp } from "../../src";
import { disconnectRxStompAndEnsure, ensureRxStompConnected } from "../helpers/helpers";
import { rxStompFactory } from "../helpers/rx-stomp-factory";

describe('Receipt', () => {
  let rxStomp: RxStomp;

  // Wait till RxStomp is actually connected
  beforeEach(() => {
    rxStomp = rxStompFactory();
  });

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  async function sendReceiveWithReceipt() {
    const queueName = '/topic/ng-demo-receipt';
    const msg = 'My very special message';

    const watchReceipt = 'watch-receipt';
    const publishReceipt = 'publish-receipt';

    // Subscribe with receipt request
    const promiseWatchReceipt = rxStomp.asyncReceipt(watchReceipt);
    const retPromise = firstValueFrom(
      rxStomp.watch(queueName, { receipt: watchReceipt })
    );
    await promiseWatchReceipt;

    // Now publish to the same queue with receipt request
    const promisePublishReceipt = rxStomp.asyncReceipt(publishReceipt);
    rxStomp.publish({
      destination: queueName,
      body: msg,
      headers: { receipt: publishReceipt },
    });
    await promisePublishReceipt;

    const message = await retPromise;
    expect(message.body).toBe(msg);
  }

  it('gets a receipt with established connection', async () => {
    // Wait till RxStomp is actually connected
    await ensureRxStompConnected(rxStomp);
    await sendReceiveWithReceipt();
  });

  it('gets a receipt for activities before establishing a connection', async () => {
    await sendReceiveWithReceipt();
  });
});
