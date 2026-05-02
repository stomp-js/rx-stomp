import { Client, FrameImpl, messageCallbackType } from '@stomp/stompjs';
import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { skip } from 'rxjs';

import { RxStomp } from '../../src';

const noop: () => void = () => undefined;

const destinationA = 'destination-a';
const destinationB = 'destination-b';

class MessageImpl extends FrameImpl {
  public ack = noop;
  public nack = noop;
}

function simulateWebSocketConnected(client: Client) {
  client.onConnect(
    new FrameImpl({
      command: 'MESSAGE',
      headers: {},
    }),
  );
}

function simulateStompErrorAtDestination(client: Client, destination: string) {
  client.onStompError(
    new FrameImpl({
      command: 'ERROR',
      body: destination,
    }),
  );
}

test.describe('Correlate Errors', () => {
  let rxStomp: RxStomp;
  let client: Client;

  test.beforeEach(() => {
    client = new Client();

    sinon.stub(client, 'activate').callsFake(() => {
      simulateWebSocketConnected(client);
    });

    // Simulate a destination that simply sends back its destination id in a message body whenever
    // subscribed
    sinon
      .stub(client, 'subscribe')
      .callsFake((destination: string, callback: messageCallbackType) => {
        callback(
          new MessageImpl({
            command: 'MESSAGE',
            body: destination,
          }),
        );

        return {
          id: `${destination}-subscription`,
          unsubscribe: noop,
        };
      });

    rxStomp = new RxStomp(client);

    // A very basic error correlation function could expect the entire
    // message body just to contain the destination that produced the error.
    rxStomp.configure({
      correlateErrors: error => error.body,
    });

    rxStomp.activate();
  });

  test.afterEach(() => {
    sinon.restore();
  });

  test('should terminate destination observable if error correlates', async () => {
    const destinationA$ = rxStomp.watch({
      destination: destinationA,
    });

    const errorPromise = new Promise<FrameImpl>((resolve, reject) => {
      destinationA$.subscribe({
        next: message => {
          expect(message.command).toBe('MESSAGE');
          expect(message.body).toBe(destinationA);
        },
        error: error => {
          resolve(error);
        },
      });
    });

    simulateStompErrorAtDestination(client, destinationA);

    const error = await errorPromise;
    expect(error.command).toBe('ERROR');
    expect(error.body).toBe(destinationA);
  });

  test('should not terminate destination observable if error does not correlate', () => {
    const destinationB$ = rxStomp.watch({
      destination: destinationB,
    });

    destinationB$.subscribe({
      next: message => {
        expect(message.command).toBe('MESSAGE');
        expect(message.body).toBe(destinationB);
      },
      error: () => {
        expect(true).toBe(false);
      },
    });

    simulateStompErrorAtDestination(client, destinationA);
  });

  test('should not automatically resubscribe destinations that error', () => {
    const destinationA$ = rxStomp.watch({
      destination: destinationA,
    });
    const destinationB$ = rxStomp.watch({
      destination: destinationB,
    });

    // We should not expect a second emit after the reconnection on this destination that will error.
    destinationA$.pipe(skip(1)).subscribe({
      next: () => expect(true).toBe(false),
      error: error => {
        expect(error.command).toBe('ERROR');
        expect(error.body).toBe(destinationA);
      },
    });

    // We should expect to see the second emit after the reconnection on this destination without error.
    destinationB$.pipe(skip(1)).subscribe({
      next: message => {
        expect(message.command).toBe('MESSAGE');
        expect(message.body).toBe(destinationB);
      },
      error: () => expect(true).toBe(false),
    });

    simulateStompErrorAtDestination(client, destinationA);

    // simulate a reconnection
    simulateWebSocketConnected(client);
  });
});
