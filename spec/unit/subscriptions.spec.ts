/* tslint:disable:no-unused-variable */

import 'jasmine';

import { filter, take } from 'rxjs/operators';

import { Message } from '@stomp/stompjs';

import { RxStomp, RxStompState } from '../../src';

import { generateBinaryData } from '../helpers/content-helpers';
import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  forceDisconnectAndEnsure,
} from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('Subscribe & Publish', () => {
  let rxStomp: RxStomp;

  // Wait till RxStomp is actually connected
  beforeEach(() => {
    rxStomp = rxStompFactory();
  });

  // Disconnect and wait till it actually disconnects
  afterEach(done => {
    disconnectRxStompAndEnsure(rxStomp, done);
    rxStomp = null;
  });

  describe('with established connection', () => {
    // Wait till RxStomp is actually connected
    beforeEach(done => {
      ensureRxStompConnected(rxStomp, done);
    });

    it('send and receive a message', done => {
      const queueName = '/topic/ng-demo-sub';
      const msg = 'My very special message';

      // Subscribe and set up the Observable
      rxStomp.watch(queueName).subscribe((message: Message) => {
        expect(message.body).toBe(msg);
        done();
      });

      // Now publish to the same queue
      rxStomp.publish({ destination: queueName, body: msg });
    });

    it('send and receive a binary message', done => {
      const queueName = '/topic/ng-demo-sub';
      const binaryMsg = generateBinaryData(1);

      // Subscribe and set up the Observable
      rxStomp.watch(queueName).subscribe((message: Message) => {
        expect(message.binaryBody.toString()).toBe(binaryMsg.toString());
        done();
      });

      // Now publish to the same queue
      rxStomp.publish({ destination: queueName, binaryBody: binaryMsg });
    });
  });

  describe('Without established connection', () => {
    it('should be able to subscribe even before STOMP is connected', done => {
      const queueName = '/topic/ng-demo-sub01';
      const msg = 'My very special message 01';

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      rxStomp.watch(queueName).subscribe((message: Message) => {
        expect(message.body).toBe(msg);
        done();
      });

      rxStomp.connected$.subscribe((state: RxStompState) => {
        // Now publish the message when STOMP Broker is connected
        rxStomp.publish({ destination: queueName, body: msg });
      });
    });

    it('should be able to publish/subscribe even before STOMP is connected', done => {
      // Queue is a durable queue
      const queueName = '/queue/ng-demo-sub02';
      const msg = 'My very special message 02' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      rxStomp
        .watch(queueName)
        .pipe(
          filter((message: Message) => {
            // Since the queue is durable, we may receive older messages as well, discard those
            return message.body === msg;
          })
        )
        .subscribe((message: Message) => {
          expect(message.body).toBe(msg);
          done();
        });

      rxStomp.publish({ destination: queueName, body: msg });
    });

    it('should be able to publish/subscribe when STOMP is disconnected', done => {
      // Queue is a durable queue
      const queueName = '/queue/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      rxStomp
        .watch(queueName)
        .pipe(
          filter((message: Message) => {
            // Since the queue is durable, we may receive older messages as well, discard those
            return message.body === msg;
          })
        )
        .subscribe((message: Message) => {
          expect(message.body).toBe(msg);
          done();
        });

      // Actively disconnect simulating error after STOMP connects, then publish the message
      forceDisconnectAndEnsure(rxStomp, () => {
        rxStomp.publish({ destination: queueName, body: msg });
      });
    });

    it('should be able to subscribe before sending queued messages', done => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      rxStomp.watch(endPoint).subscribe((message: Message) => {
        expect(message.body).toBe(msg);
        done();
      });

      rxStomp.publish({ destination: endPoint, body: msg });
    });

    it('should be able to subscribe before sending queued messages when broker was disconnected', done => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      rxStomp.watch(endPoint).subscribe((message: Message) => {
        expect(message.body).toBe(msg);
        done();
      });

      // Wait for the first connect, set publish after disconnect
      // then force a disconnect
      forceDisconnectAndEnsure(rxStomp, () => {
        rxStomp.publish({ destination: endPoint, body: msg });
      });
    });

    describe('When providing retry flag', () => {
      it('should not be able to publish even before STOMP is connected', () => {
        // Queue is a durable queue
        const queueName = '/queue/ng-demo-sub02';
        const msg = 'My very special message 02' + Math.random();
        expect(() =>
          rxStomp.publish({
            destination: queueName,
            body: msg,
            retryIfDisconnected: false,
          })
        ).toThrow();
      });

      it('should be able to publish/subscribe when STOMP is disconnected', done => {
        // Queue is a durable queue
        const queueName = '/queue/ng-demo-sub02';
        const msg = 'My very special message 03' + Math.random();
        // Actively disconnect simulating error after STOMP connects, then publish the message
        forceDisconnectAndEnsure(rxStomp, () => {
          expect(() =>
            rxStomp.publish({
              destination: queueName,
              body: msg,
              retryIfDisconnected: false,
            })
          ).toThrow();
          done();
        });
      });
    });
  });

  describe('Headers', () => {
    const queueName = '/topic/ng-demo-sub';
    const subHeaders = { hello: 'world' };
    const unsubHeaders = { bye: 'world' };

    let subSpy: any;
    let unsubSpy: any;

    // Wait till RxStomp is actually connected
    beforeEach(done => {
      ensureRxStompConnected(rxStomp, done);
    });

    beforeEach(() => {
      subSpy = spyOn(rxStomp.stompClient, 'subscribe').and.callThrough();
      unsubSpy = spyOn(
        // @ts-ignore - accessing private property
        rxStomp.stompClient._stompHandler,
        'unsubscribe'
      ).and.callThrough();
    });

    it('should send subscription headers', () => {
      const sub = rxStomp
        .watch({ destination: queueName, subHeaders })
        .subscribe(() => {});
      expect(subSpy.calls.argsFor(0)[2]).toEqual(subHeaders);
    });

    it('should use passed unsubscription headers', () => {
      const sub = rxStomp
        .watch({ destination: queueName, unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(unsubSpy.calls.argsFor(0)[1]).toEqual(unsubHeaders);
    });

    it('should use unsubscription headers returned by a function', () => {
      const sub = rxStomp
        .watch({ destination: queueName, unsubHeaders: () => unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(unsubSpy.calls.argsFor(0)[1]).toEqual(unsubHeaders);
    });

    it('should use subscription/unsubscription headers', () => {
      const sub = rxStomp
        .watch({ destination: queueName, subHeaders, unsubHeaders })
        .subscribe(() => {});

      sub.unsubscribe();
      expect(subSpy.calls.argsFor(0)[2]).toEqual(subHeaders);
      expect(unsubSpy.calls.argsFor(0)[1]).toEqual(unsubHeaders);
    });
  });

  describe('Reconnection', () => {
    describe('should resubscribe', () => {
      let onMessage: (message: Message) => void;
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 05' + Math.random();

      // Start the watch
      beforeEach(() => {
        rxStomp.watch(endPoint).subscribe(message => onMessage(message));
      });

      // Force disconnect
      beforeEach(done => {
        forceDisconnectAndEnsure(rxStomp, done);
      });

      // Wait till RxStomp is actually connected
      beforeEach(done => {
        ensureRxStompConnected(rxStomp, done);
      });

      // The client should reconnect and destination should be subscribed again
      it('should resubscribe', done => {
        onMessage = (message: Message) => {
          expect(message.body).toBe(msg);
          done();
        };

        rxStomp.publish({ destination: endPoint, body: msg });
      });
    });

    describe('should not resubscribe with subscribeOnlyOnce', () => {
      let onMessage: (message: Message) => void;
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 05' + Math.random();

      // Start the watch
      beforeEach(() => {
        rxStomp
          .watch({ destination: endPoint, subscribeOnlyOnce: true })
          .subscribe(message => onMessage(message));
      });

      // Force disconnect
      beforeEach(done => {
        forceDisconnectAndEnsure(rxStomp, done);
      });

      // Wait till RxStomp is actually connected
      beforeEach(done => {
        ensureRxStompConnected(rxStomp, done);
      });

      // The client should reconnect and destination should be subscribed again
      it('should resubscribe', done => {
        onMessage = jasmine.createSpy('onMessage');
        rxStomp.publish({ destination: endPoint, body: msg });

        setTimeout(() => {
          expect(onMessage).not.toHaveBeenCalled();
          done();
        }, 1000);
      });
    });
  });
});
