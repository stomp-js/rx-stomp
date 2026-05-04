import { test, expect } from '@playwright/test';

import { RxStomp, RxStompState } from '../../src/index.js';

import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  ensureRxStompDisconnected,
  wait,
} from '../helpers/helpers.js';
import { rxStompFactory } from '../helpers/rx-stomp-factory.js';

test.describe('Deactivate', () => {
  let rxStomp!: RxStomp;

  test.beforeEach(async () => {
    rxStomp = rxStompFactory();
    await ensureRxStompConnected(rxStomp);
  });

  // Disconnect and wait till it actually disconnects
  test.afterEach(async () => {
    await ensureRxStompDisconnected(rxStomp);
  });

  test.describe('should disconnect', () => {
    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of the reconnect-delay)
    test.beforeEach(async () => {
      await rxStomp.deactivate();
      await wait(500);
    });

    test('and not reconnect', () => {
      expect(rxStomp.connectionState$.getValue()).toEqual(RxStompState.CLOSED);
    });

    test('should be inactive', () => {
      expect(rxStomp.active).toBe(false);
    });
  });

  test('should deactivate even when underlying connection is not there and not reconnect', async () => {
    // Simulate error on WebSocket and wait for while and call disconnect
    await disconnectRxStompAndEnsure(rxStomp);

    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of the reconnect-delay)
    await rxStomp.deactivate();
    await wait(500);

    expect(rxStomp.connectionState$.getValue()).not.toEqual(RxStompState.OPEN);
  });
});
