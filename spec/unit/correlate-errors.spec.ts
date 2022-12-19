import { Client, messageCallbackType, FrameImpl } from '@stomp/stompjs';
import 'jasmine';
import { skip } from 'rxjs/operators';

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
    })
  );
}

function simulateStompErrorAtDestination(client: Client, destination: string) {
  client.onStompError(
    new FrameImpl({
      command: 'ERROR',
      body: destination,
    })
  );
}

describe('Correlate Errors', () => {
  let rxStomp: RxStomp;
  let client: Client;

  beforeEach(() => {
    client = new Client();

    spyOn(client, 'activate').and.callFake(() => {
      simulateWebSocketConnected(client);
    });

    // Simulate a destination that simply sends back its destination id in a message body whenever
    // subscribed
    spyOn(client, 'subscribe').and.callFake(
      (destination: string, callback: messageCallbackType) => {
        callback(
          new MessageImpl({
            command: 'MESSAGE',
            body: destination,
          })
        );

        return {
          id: `${destination}-subscription`,
          unsubscribe: noop,
        };
      }
    );

    rxStomp = new RxStomp(client);

    // A very basic error correlation function could expect the entire
    // message body just to contain the destination that produced the error.
    rxStomp.configure({
      correlateErrors: error => error.body,
    });

    rxStomp.activate();
  });

  it('should terminate destination observable if error correlates', done => {
    const destinationA$ = rxStomp.watch({
      destination: destinationA,
    });

    destinationA$.subscribe({
      next: message => {
        expect(message.command).toBe('MESSAGE');
        expect(message.body).toBe(destinationA);
      },
      error: error => {
        expect(error.command).toBe('ERROR');
        expect(error.body).toBe(destinationA);
        done();
      },
    });

    simulateStompErrorAtDestination(client, destinationA);
  });

  it('should not terminate destination observable if error does not correlate', () => {
    const destinationB$ = rxStomp.watch({
      destination: destinationB,
    });

    destinationB$.subscribe({
      next: message => {
        expect(message.command).toBe('MESSAGE');
        expect(message.body).toBe(destinationB);
      },
      error: () => {
        fail();
      },
    });

    simulateStompErrorAtDestination(client, destinationA);
  });

  it('should not automatically resubscribe destinations that error', () => {
    const destinationA$ = rxStomp.watch({
      destination: destinationA,
    });
    const destinationB$ = rxStomp.watch({
      destination: destinationB,
    });

    // We should not expect a second emit after the reconnection on this destination that will error.
    destinationA$.pipe(skip(1)).subscribe({
      next: () => fail(),
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
      error: () => fail(),
    });

    simulateStompErrorAtDestination(client, destinationA);

    // simulate a reconnection
    simulateWebSocketConnected(client);
  });
});
