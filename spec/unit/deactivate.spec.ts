/* tslint:disable:no-unused-variable */

import 'jasmine';

import { RxStomp, RxStompState } from '../../src';

import {
  disconnectRxStompAndEnsure,
  ensureRxStompConnected,
  ensureRxStompDisconnected,
} from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('Deactivate', () => {
  let rxStomp: RxStomp;

  beforeEach(async () => {
    rxStomp = rxStompFactory();
    await ensureRxStompConnected(rxStomp);
  });

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await ensureRxStompDisconnected(rxStomp);
    rxStomp = null;
  });

  describe('should disconnect', () => {
    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of reconnect delay)
    beforeEach(done => {
      rxStomp.deactivate();
      setTimeout(() => {
        done();
      }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.connectionState$.getValue()).toEqual(RxStompState.CLOSED);
    });

    it('should be inactive', () => {
      expect(rxStomp.active).toBe(false);
    });
  });

  describe('should deactivate even when underlying connection is not there', () => {
    // Simulate error on WebSocket and wait for while and call disconnect
    beforeEach(async () => disconnectRxStompAndEnsure(rxStomp));

    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of reconnect delay)
    beforeEach(done => {
      rxStomp.deactivate();
      setTimeout(() => {
        done();
      }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.connectionState$.getValue()).not.toEqual(
        RxStompState.OPEN
      );
    });
  });
});
