import { test, expect } from '@playwright/test';
import sinon from 'sinon';

import { map, Subscription } from 'rxjs';

import { RxStomp } from '../../src';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  wait,
} from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

test.describe('Multiple Queues', () => {
  let rxStomp: RxStomp | null;

  // Wait till RxStomp is actually connected
  test.beforeEach(async () => {
    rxStomp = rxStompFactory();
    await ensureRxStompConnected(rxStomp);
  });

  // Disconnect and wait till it actually disconnects
  test.afterEach(async () => {
    sinon.restore();
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  test.describe('should handle two simultaneous subscriptions', () => {
    const queueName1 = '/topic/ng-demo-sub01';
    const queueName2 = '/topic/ng-demo-sub02';

    let queSubscription1: Subscription;
    let queSubscription2: Subscription;

    const handlers = {
      handler1: () => {},
      handler2: () => {},
    };

    let spyHandler1: sinon.SinonSpy;
    let spyHandler2: sinon.SinonSpy;

    test.beforeEach(() => {
      spyHandler1 = sinon.spy(handlers, 'handler1');
      spyHandler2 = sinon.spy(handlers, 'handler2');
    });

    // Subscribe to both queues
    test.beforeEach(async () => {
      queSubscription1 = rxStomp
        .watch(queueName1)
        .pipe(map(message => message.body))
        .subscribe(spyHandler1);

      queSubscription2 = rxStomp
        .watch(queueName2)
        .pipe(map(message => message.body))
        .subscribe(spyHandler2);

      await wait(100);
    });

    // Send one message to each queue and verify that these are received in respective subscriptions
    test.beforeEach(async () => {
      rxStomp.publish({ destination: queueName1, body: 'Message 01-01' });
      rxStomp.publish({ destination: queueName2, body: 'Message 02-01' });

      await wait(100);
      expect(spyHandler1.calledWith('Message 01-01')).toBe(true);
      expect(spyHandler2.calledWith('Message 02-01')).toBe(true);
    });

    test('should receive message in correct queue', () => {
      // It is ensured by all beforeEach blocks
      expect(true).toBe(true);
    });

    test.describe('unsubscribe both queues', () => {
      test.beforeEach(async () => {
        queSubscription1.unsubscribe();
        queSubscription2.unsubscribe();
        await wait(100);
      });

      test('should not receive message in any of the  queues', async () => {
        rxStomp.publish({ destination: queueName1, body: 'Message 01-02' });
        rxStomp.publish({ destination: queueName2, body: 'Message 02-02' });

        await wait(100);
        expect(spyHandler1.callCount).toBe(1);
        expect(spyHandler2.callCount).toBe(1);
      });
    });
  });
});
