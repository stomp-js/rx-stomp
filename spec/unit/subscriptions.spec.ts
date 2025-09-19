/* tslint:disable:no-unused-variable */

import 'jasmine';

import { filter, firstValueFrom } from 'rxjs';

import { IMessage, RxStomp, RxStompState } from '../../src';
import { generateBinaryData } from '../helpers/content-helpers';
import { disconnectRxStompAndEnsure, ensureRxStompConnected, forceDisconnectAndEnsure, wait } from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('Subscribe & Publish', () => {
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

  describe('with established connection', () => {
    // Wait till RxStomp is actually connected
    beforeEach(async () => ensureRxStompConnected(rxStomp));

    it('send and receive a message', async () => {
      const queueName = '/topic/ng-demo-sub';
      const msg = 'My very special message';

      // Subscribe
      const retPromise = firstValueFrom(rxStomp.watch(queueName));

      // Now publish to the same queue
      rxStomp.publish({ destination: queueName, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('send and receive a binary message', async () => {
      const queueName = '/topic/ng-demo-sub';
      const binaryMsg = generateBinaryData(1);

      // Subscribe
      const retPromise = firstValueFrom(rxStomp.watch(queueName));

      // Now publish to the same queue
      rxStomp.publish({ destination: queueName, binaryBody: binaryMsg });

      const message = await retPromise;
      expect(message.binaryBody.toString()).toBe(binaryMsg.toString());
    });
  });

  describe('Without established connection', () => {
    it('should be able to subscribe even before STOMP is connected', async () => {
      const queueName = '/topic/ng-demo-sub01';
      const msg = 'My very special message 01';

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(queueName).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );

      rxStomp.connected$.subscribe((state: RxStompState) => {
        // Now publish the message when STOMP Broker is connected
        rxStomp.publish({ destination: queueName, body: msg });
      });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('should be able to publish/subscribe even before STOMP is connected', async () => {
      // Queue is a durable queue
      const queueName = '/queue/ng-demo-sub02';
      const msg = 'My very special message 02' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(queueName).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );

      rxStomp.publish({ destination: queueName, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('should be able to publish/subscribe when STOMP is disconnected', async () => {
      // Queue is a durable queue
      const queueName = '/queue/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Actively disconnect simulating error after STOMP connects, then publish the message
      await forceDisconnectAndEnsure(rxStomp);

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(queueName).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );
      rxStomp.publish({ destination: queueName, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('should be able to subscribe before queued messages are actually sent', async () => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Actively disconnect simulating error after STOMP connects, then publish the message
      await forceDisconnectAndEnsure(rxStomp);

      // Send the message, it will be queued locally.
      rxStomp.publish({ destination: endPoint, body: msg });

      // Now subscribe, while it is still waiting to connect.
      const retPromise = firstValueFrom(
        rxStomp.watch(endPoint).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('should be able to subscribe before sending queued messages when broker was disconnected', async () => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 03' + Math.random();

      // Subscribe and set up the Observable, the underlying STOMP may not have been connected
      const retPromise = firstValueFrom(
        rxStomp.watch(endPoint).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );

      // Wait for the first connection, set publish after disconnect
      // then force a disconnect
      await forceDisconnectAndEnsure(rxStomp);
      rxStomp.publish({ destination: endPoint, body: msg });

      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    describe('When providing retry flag', () => {
      it('should not be able to publish before STOMP is connected', () => {
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

      it('should not be able to publish when STOMP is disconnected', async () => {
        // Queue is a durable queue
        const queueName = '/queue/ng-demo-sub02';
        const msg = 'My very special message 03' + Math.random();
        // Actively disconnect simulating error after STOMP connects, then publish the message
        await forceDisconnectAndEnsure(rxStomp);
        expect(() =>
          rxStomp.publish({
            destination: queueName,
            body: msg,
            retryIfDisconnected: false,
          })
        ).toThrow();
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
    beforeEach(async () => ensureRxStompConnected(rxStomp));

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

    it('should send subscription headers returned by a function', () => {
      const sub = rxStomp
        .watch({ destination: queueName, subHeaders: () => subHeaders })
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
    it('should resubscribe on reconnection', async () => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 05' + Math.random();

      const retPromise = firstValueFrom(
        rxStomp.watch(endPoint).pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
      );

      // Force disconnect
      await forceDisconnectAndEnsure(rxStomp);

      // Wait till RxStomp is actually connected
      await ensureRxStompConnected(rxStomp);

      rxStomp.publish({ destination: endPoint, body: msg });

      // wait for the message to be delivered
      const message = await retPromise;
      expect(message.body).toBe(msg);
    });

    it('should not resubscribe with subscribeOnlyOnce', async () => {
      const endPoint = '/topic/ng-demo-sub02';
      const msg = 'My very special message 05' + Math.random();

      const onMessage = jasmine.createSpy('onMessage');

      rxStomp
        .watch({ destination: endPoint, subscribeOnlyOnce: true })
        .pipe(
          // Since the queue is durable, we may receive older messages as well, discard those
          filter((m: IMessage) => m.body === msg)
        )
        .subscribe(m => onMessage(m));

      // Force disconnect
      await forceDisconnectAndEnsure(rxStomp);

      // Wait till RxStomp is actually connected
      await ensureRxStompConnected(rxStomp);

      rxStomp.publish({ destination: endPoint, body: msg });

      // wait for some time
      await wait(1000);

      expect(onMessage).not.toHaveBeenCalled();
    });
  });
});
