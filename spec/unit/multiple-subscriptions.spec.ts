/* tslint:disable:no-unused-variable */

import 'jasmine';

import { map } from 'rxjs/operators';

import { RxStomp } from '../../src';

import { Subscription } from 'rxjs';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
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
    beforeEach(done => {
      queSubscription1 = rxStomp
        .watch(queueName1)
        .pipe(map(message => message.body))
        .subscribe(spyHandler1);

      queSubscription2 = rxStomp
        .watch(queueName2)
        .pipe(map(message => message.body))
        .subscribe(spyHandler2);

      setTimeout(() => {
        done();
      }, 100);
    });

    // Send one message to each queue and verify that these are received in respective subscriptions
    beforeEach(done => {
      rxStomp.publish({ destination: queueName1, body: 'Message 01-01' });
      rxStomp.publish({ destination: queueName2, body: 'Message 02-01' });

      setTimeout(() => {
        expect(spyHandler1).toHaveBeenCalledWith('Message 01-01');
        expect(spyHandler2).toHaveBeenCalledWith('Message 02-01');

        done();
      }, 100);
    });

    it('should receive message in correct queue', () => {
      // It is ensured by all beforeEach blocks
      expect(true).toBe(true);
    });

    describe('unsubscribe both queues', () => {
      beforeEach(done => {
        queSubscription1.unsubscribe();
        queSubscription2.unsubscribe();
        setTimeout(() => {
          done();
        }, 100);
      });

      it('should not receive message in any of the  queues', done => {
        rxStomp.publish({ destination: queueName1, body: 'Message 01-02' });
        rxStomp.publish({ destination: queueName2, body: 'Message 02-02' });

        setTimeout(() => {
          expect(spyHandler1.calls.count()).toBe(1);
          expect(spyHandler2.calls.count()).toBe(1);

          done();
        }, 100);
      });
    });
  });
});
