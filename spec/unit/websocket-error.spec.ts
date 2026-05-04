import { firstValueFrom, take } from 'rxjs';

import { test, expect } from '@playwright/test';

import { RxStomp } from '../../src/index.js';

import { disconnectRxStompAndEnsure } from '../helpers/helpers.js';
import { defaultConfig } from '../helpers/rx-stomp-factory.js';

test.describe('WebSocket Error', () => {
  let rxStomp: RxStomp | null;

  // Disconnect and wait till it actually disconnects
  test.afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  test('should trigger webSocketErrors$', async () => {
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
