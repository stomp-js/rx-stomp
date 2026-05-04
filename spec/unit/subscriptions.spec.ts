import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { v4 as uuid } from 'uuid';

import { filter, firstValueFrom } from 'rxjs';

import { IMessage, RxStomp, RxStompState } from '../../src/index.js';
import { generateBinaryData } from '../helpers/content-helpers.js';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  forceDisconnectAndEnsure,
  wait,
} from '../helpers/helpers.js';
import { rxStompFactory } from '../helpers/rx-stomp-factory.js';

test.describe('Subscribe & Publish', () => {
  let rxStomp!: RxStomp;
  let testId: string;

  // Wait till RxStomp is actually connected
  test.beforeEach(() => {
    testId = uuid().slice(0, 8);
    rxStomp = rxStompFactory();
  });

  // Disconnect and wait till it actually disconnects
  test.afterEach(async () => {
    sinon.restore();
    await disconnectRxStompAndEnsure(rxStomp);
  });

  test.describe('with established connection', () => {
    // Wait till RxStomp is actually connected
    test.beforeEach(async () => ensureRxStompConnected(rxStomp));

    test('send and receive a message', async () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const msg = 'My very special message';

      // Subscribe
      const retPromise = firstValueFrom(rxStomp.watch(topicSub));

      // Now publish to the same queue
      rxStomp.publish({ destination: topicSub, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('send and receive a binary message', async () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const binaryMsg = generateBinaryData(1);

      // Subscribe
      const retPromise = firstValueFrom(rxStomp.watch(topicSub));

      // Now publish to the same queue
      rxStomp.publish({ destination: topicSub, binaryBody: binaryMsg });

      const message = await retPromise;
      expect(message.binaryBody.toString()).toBe(binaryMsg.toString());
    });
  });

  test.describe('Without established connection', () => {
    test('should be able to subscribe even before STOMP is connected', async () => {
      const topicSub01 = `/topic/ng-demo-sub01-${testId}`;
      const msg = 'My very special message 01';

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(topicSub01).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );

      rxStomp.connected$.subscribe((state: RxStompState) => {
        // Now publish the message when STOMP Broker is connected
        rxStomp.publish({ destination: topicSub01, body: msg });
      });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('should be able to publish/subscribe even before STOMP is connected', async () => {
      // Queue is a durable queue
      const queueSub02 = `/queue/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 02' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(queueSub02).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );

      rxStomp.publish({ destination: queueSub02, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('should be able to publish/subscribe when STOMP is disconnected', async () => {
      // Queue is a durable queue
      const queueSub02 = `/queue/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 03' + Math.random();

      // Actively disconnect simulating error after STOMP connects, then publish the message
      await forceDisconnectAndEnsure(rxStomp);

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(queueSub02).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );
      rxStomp.publish({ destination: queueSub02, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('should be able to subscribe before queued messages are actually sent', async () => {
      const topicSub02 = `/topic/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 03' + Math.random();

      // Actively disconnect simulating error after STOMP connects, then publish the message
      await forceDisconnectAndEnsure(rxStomp);

      // Send the message, it will be queued locally.
      rxStomp.publish({ destination: topicSub02, body: msg });

      // Now subscribe, while it is still waiting to connect.
      const retPromise = firstValueFrom(
        rxStomp.watch(topicSub02).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('should be able to subscribe before sending queued messages when broker was disconnected', async () => {
      const topicSub02 = `/topic/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 03' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(topicSub02).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );

      // Wait for the first connection, set publish after disconnect
      // then force a disconnect
      await forceDisconnectAndEnsure(rxStomp);
      rxStomp.publish({ destination: topicSub02, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test.describe('When providing retry flag', () => {
      test('should not be able to publish before STOMP is connected', () => {
        const queueSub02 = `/queue/ng-demo-sub02-${testId}`;
        const msg = 'My very special message 02' + Math.random();
        expect(() =>
          rxStomp.publish({
            destination: queueSub02,
            body: msg,
            retryIfDisconnected: false,
          }),
        ).toThrow();
      });

      test('should not be able to publish when STOMP is disconnected', async () => {
        const queueSub02 = `/queue/ng-demo-sub02-${testId}`;
        const msg = 'My very special message 03' + Math.random();
        // Actively disconnect simulating error after STOMP connects, then publish the message
        await forceDisconnectAndEnsure(rxStomp);
        expect(() =>
          rxStomp.publish({
            destination: queueSub02,
            body: msg,
            retryIfDisconnected: false,
          }),
        ).toThrow();
      });
    });
  });

  test.describe('Headers', () => {
    const subHeaders = { hello: 'world' };
    const unsubHeaders = { bye: 'world' };

    let subSpy: sinon.SinonSpy;
    let unsubSpy: sinon.SinonSpy;

    // Wait till RxStomp is actually connected
    test.beforeEach(async () => ensureRxStompConnected(rxStomp));

    test.beforeEach(() => {
      subSpy = sinon.spy(rxStomp.stompClient, 'subscribe');
      unsubSpy = sinon.spy(
        // @ts-expect-error - accessing private property
        rxStomp.stompClient._stompHandler,
        'unsubscribe',
      );
    });

    test('should send subscription headers', () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const sub = rxStomp
        .watch({ destination: topicSub, subHeaders })
        .subscribe(() => {});
      expect(subSpy.args[0][2]).toEqual(subHeaders);
    });

    test('should send subscription headers returned by a function', () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const sub = rxStomp
        .watch({ destination: topicSub, subHeaders: () => subHeaders })
        .subscribe(() => {});

      expect(subSpy.args[0][2]).toEqual(subHeaders);
    });

    test('should use passed unsubscription headers', () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const sub = rxStomp
        .watch({ destination: topicSub, unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(unsubSpy.args[0][1]).toEqual(unsubHeaders);
    });

    test('should use unsubscription headers returned by a function', () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const sub = rxStomp
        .watch({ destination: topicSub, unsubHeaders: () => unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(unsubSpy.args[0][1]).toEqual(unsubHeaders);
    });

    test('should use subscription/unsubscription headers', () => {
      const topicSub = `/topic/ng-demo-sub-${testId}`;
      const sub = rxStomp
        .watch({ destination: topicSub, subHeaders, unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(subSpy.args[0][2]).toEqual(subHeaders);
      expect(unsubSpy.args[0][1]).toEqual(unsubHeaders);
    });
  });

  test.describe('Reconnection', () => {
    test('should resubscribe on reconnection', async () => {
      const topicSub02 = `/topic/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 05' + Math.random();

      const retPromise = firstValueFrom(
        rxStomp.watch(topicSub02).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        ),
      );

      // Force disconnect
      await forceDisconnectAndEnsure(rxStomp);

      // Wait till RxStomp is actually connected
      await ensureRxStompConnected(rxStomp);

      rxStomp.publish({ destination: topicSub02, body: msg });

      // wait for the message to be delivered
      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    test('should not resubscribe with subscribeOnlyOnce', async () => {
      const topicSub02 = `/topic/ng-demo-sub02-${testId}`;
      const msg = 'My very special message 05' + Math.random();

      const onMessage = sinon.spy();

      rxStomp
        .watch({ destination: topicSub02, subscribeOnlyOnce: true })
        .pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg),
        )
        .subscribe(m => onMessage(m));

      // Force disconnect
      await forceDisconnectAndEnsure(rxStomp);

      // Wait till RxStomp is actually connected
      await ensureRxStompConnected(rxStomp);

      rxStomp.publish({ destination: topicSub02, body: msg });

      // wait for some time
      await wait(1000);

      expect(onMessage.called).toBe(false);
    });
  });
});
