import { skip, take } from 'rxjs/operators';

import 'jasmine';

import { RxStomp } from '../../src';

import { disconnectRxStompAndEnsure } from '../helpers/helpers';
import { defaultConfig } from '../helpers/rx-stomp-factory';

describe('Connection', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  it('should call beforeConnect', done => {
    rxStomp = new RxStomp();
    rxStomp.configure(defaultConfig());

    const beforeConnect = jasmine.createSpy();
    rxStomp.configure({ beforeConnect });

    rxStomp.activate();

    // Disconnect so that it reconnects
    rxStomp.connected$.pipe(take(1)).subscribe(() => {
      expect(beforeConnect).toHaveBeenCalled();
      rxStomp.stompClient.forceDisconnect();
    });

    // When it reconnects, beforeConnect should be called again
    rxStomp.connected$.pipe(skip(1), take(1)).subscribe(() => {
      expect(beforeConnect.calls.count()).toEqual(2);
      done();
    });
  });

  it('should allow async beforeConnect', done => {
    // In this test, initially there is no valid configuration to connect to the broker
    // The configuration is set in async beforeConnect
    rxStomp = new RxStomp();

    const beforeConnect = (client: RxStomp) => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          client.configure(defaultConfig());
          resolve();
        }, 200);
      });
    };

    rxStomp.configure({ beforeConnect });
    rxStomp.activate();
    rxStomp.connected$.subscribe(() => {
      done();
    });
  });
});
