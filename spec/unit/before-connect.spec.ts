import { firstValueFrom, skip, take } from 'rxjs';

import 'jasmine';

import { RxStomp } from '../../src';

import { disconnectRxStompAndEnsure, wait } from '../helpers/helpers';
import { defaultConfig } from '../helpers/rx-stomp-factory';

describe('Connection', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  it('should call beforeConnect', async () => {
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
    await firstValueFrom(rxStomp.connected$.pipe(skip(1), take(1)));
    expect(beforeConnect.calls.count()).toEqual(2);
  });

  it('should allow async beforeConnect', async () => {
    // In this test, initially there is no valid configuration to connect to the broker
    // The configuration is set in async beforeConnect
    rxStomp = new RxStomp();

    const beforeConnect = async (client: RxStomp) => {
      await wait(200);
      client.configure(defaultConfig());
    };

    rxStomp.configure({ beforeConnect });
    rxStomp.activate();
    await firstValueFrom(rxStomp.connected$);
  });
});
