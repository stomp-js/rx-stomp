/* tslint:disable:no-unused-variable */

import "jasmine";

import { map } from 'rxjs/operators';
import { RxStomp } from '../../src';
import { defaultConfig, MyRxStomp } from '../helpers/rx-stomp-factory';
import { ensureStompConnected, disconnetStompRAndEnsure} from '../helpers/helpers';
import { Subscription } from 'rxjs';

describe('RxStomp Queues', () => {
  let rxStomp: RxStomp;
  const rxStompConfig = defaultConfig();

  // Wait till STOMP Service is actually connected
  beforeEach((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

    rxStomp = new MyRxStomp();
    rxStomp.config = rxStompConfig;
    rxStomp.initAndConnect();
    ensureStompConnected(rxStomp, done);
  });

  // Disconnect and wait till it actually disconnects
  afterEach((done) => {
    disconnetStompRAndEnsure(rxStomp, done);
    rxStomp = null;
  });

  describe('should handle two simultaneous subscriptions', () => {
    const queueName1 = '/topic/ng-demo-sub01';
    const queueName2 = '/topic/ng-demo-sub02';

    let queSubscription1: Subscription;
    let queSubscription2: Subscription;

    const handlers = {
      handler1: () => {},
      handler2: () => {}
    };

    let spyHandler1: jasmine.Spy;
    let spyHandler2: jasmine.Spy;

    beforeEach(() => {
      spyHandler1 = spyOn(handlers, 'handler1');
      spyHandler2 = spyOn(handlers, 'handler2');
    });

    // Subscribe to both queues
    beforeEach((done) => {
      queSubscription1 = rxStomp.subscribe(queueName1).pipe(
        map((message) => message.body)
      ).subscribe(spyHandler1);

      queSubscription2 = rxStomp.subscribe(queueName2).pipe(
        map((message) => message.body)
      ).subscribe(spyHandler2);

      setTimeout(() => {
        done();
      }, 100);
    });

    // Send one message to each queue and verify that these are received in respective subscriptions
    beforeEach((done) => {
      rxStomp.publish(queueName1, 'Message 01-01');
      rxStomp.publish(queueName2, 'Message 02-01');

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

    describe('unsubscribe first queue', () => {
      beforeEach((done) => {
        queSubscription1.unsubscribe();
        setTimeout(() => {
          done();
        }, 100);
      });

      it('should not receive message in the first queue', (done) => {
        rxStomp.publish(queueName1, 'Message 01-02');
        rxStomp.publish(queueName2, 'Message 02-02');

        setTimeout(() => {
          expect(spyHandler1.calls.count()).toBe(1);
          expect(spyHandler2.calls.count()).toBe(2);

          done();
        }, 100);
      });
    });

    describe('unsubscribe second queue', () => {
      beforeEach((done) => {
        queSubscription2.unsubscribe();
        setTimeout(() => {
          done();
        }, 100);
      });

      it('should not receive message in the second queue', (done) => {
        rxStomp.publish(queueName1, 'Message 01-02');
        rxStomp.publish(queueName2, 'Message 02-02');

        setTimeout(() => {
          expect(spyHandler1.calls.count()).toBe(2);
          expect(spyHandler2.calls.count()).toBe(1);

          done();
        }, 100);
      });
    });

    describe('unsubscribe both queues', () => {
      beforeEach((done) => {
        queSubscription1.unsubscribe();
        queSubscription2.unsubscribe();
        setTimeout(() => {
          done();
        }, 100);
      });

      it('should not receive message in any of the  queues', (done) => {
        rxStomp.publish(queueName1, 'Message 01-02');
        rxStomp.publish(queueName2, 'Message 02-02');

        setTimeout(() => {
          expect(spyHandler1.calls.count()).toBe(1);
          expect(spyHandler2.calls.count()).toBe(1);

          done();
        }, 100);
      });
    });
  });
});
