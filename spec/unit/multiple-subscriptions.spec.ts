/* tslint:disable:no-unused-variable */

import 'jasmine';

import { map, Subscription } from 'rxjs';

import { RxStomp } from '../../src';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  wait,
} from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('Multiple Queues', () => {
  let rxStomp: RxStomp;

  // Wait till RxStomp is actually connected
  beforeEach(async () => {
    rxStomp = rxStompFactory();
    await ensureRxStompConnected(rxStomp);
  });

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  describe('should handle two simultaneous subscriptions', () => {
    const queueName1 = '/topic/ng-demo-sub01';
    const queueName2 = '/topic/ng-demo-sub02';

    let queSubscription1: Subscription;
    let queSubscription2: Subscription;

    const handlers = {
      handler1: () => {},
      handler2: () => {},
    };

    let spyHandler1: jasmine.Spy;
    let spyHandler2: jasmine.Spy;

    beforeEach(() => {
      spyHandler1 = spyOn(handlers, 'handler1');
      spyHandler2 = spyOn(handlers, 'handler2');
    });

    // Subscribe to both queues
    beforeEach(async () => {
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
    beforeEach(async () => {
      rxStomp.publish({ destination: queueName1, body: 'Message 01-01' });
      rxStomp.publish({ destination: queueName2, body: 'Message 02-01' });

      await wait(100);
      expect(spyHandler1).toHaveBeenCalledWith('Message 01-01');
      expect(spyHandler2).toHaveBeenCalledWith('Message 02-01');
    });

    it('should receive message in correct queue', () => {
      // It is ensured by all beforeEach blocks
      expect(true).toBe(true);
    });

    describe('unsubscribe both queues', () => {
      beforeEach(async () => {
        queSubscription1.unsubscribe();
        queSubscription2.unsubscribe();
        await wait(100);
      });

      it('should not receive message in any of the  queues', async () => {
        rxStomp.publish({ destination: queueName1, body: 'Message 01-02' });
        rxStomp.publish({ destination: queueName2, body: 'Message 02-02' });

        await wait(100);
        expect(spyHandler1.calls.count()).toBe(1);
        expect(spyHandler2.calls.count()).toBe(1);
      });
    });
  });
});
