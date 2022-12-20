import { firstValueFrom, take } from 'rxjs';

import 'jasmine';

import { RxStomp } from '../../src';

import { disconnectRxStompAndEnsure } from '../helpers/helpers';
import { defaultConfig } from '../helpers/rx-stomp-factory';

describe('WebSocket Error', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  it('should trigger webSocketErrors$', async () => {
    rxStomp = new RxStomp();
    rxStomp.configure(defaultConfig());

    // Invalid URL
    rxStomp.configure({ brokerURL: 'ws://127.0.0.1:15600/ws' });

    rxStomp.activate();

    // Disconnect so that it reconnects
    rxStomp.connected$.pipe(take(1)).subscribe(() => {
      expect(true).toEqual(false);
    });

    const evt = await firstValueFrom(rxStomp.webSocketErrors$);
    expect(evt).toBeTruthy();
  });
});
