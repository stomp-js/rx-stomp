/* tslint:disable:no-unused-variable */

import 'jasmine';

import { RxStomp } from '../../src';

import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
} from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';
import { firstValueFrom } from 'rxjs';

describe('Connection', () => {
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

  it('should be active', () => {
    expect(rxStomp.active).toBe(true);
  });

  it('should connect', async () => {
    await ensureRxStompConnected(rxStomp);
  });

  it('should receive server headers', async () => {
    const headers = await firstValueFrom(rxStomp.serverHeaders$);
    // Check that we have received at least one key in header
    expect(Object.keys(headers).length).toBeGreaterThan(0);

    // Subscribe again, we should get the same set of headers
    // (as per specifications, if STOMP has already connected it should immediately trigger)
    const headers2 = await firstValueFrom(rxStomp.serverHeaders$);
    expect(headers2).toEqual(headers);
  });
});
