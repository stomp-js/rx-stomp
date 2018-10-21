/* tslint:disable:no-unused-variable */

import "jasmine";

import { RxStomp, StompState } from '../../src';

import { rxStompFactory } from '../helpers/rx-stomp-factory';
import {disconnetStompRAndEnsure, ensureStompConnected, ensureStompRDisconnected} from '../helpers/helpers';

describe('RxStomp disconnect', () => {
  let rxStomp: RxStomp;

  beforeEach((done) => {
    rxStomp = rxStompFactory();
    ensureStompConnected(rxStomp, done);
  });

  // Disconnect and wait till it actually disconnects
  afterEach((done) => {
    ensureStompRDisconnected(rxStomp, done);
    rxStomp = null;
  });

  describe('should disconnect', () => {
    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of reconnect delay)
    beforeEach((done) => {
      rxStomp.deactivate();
      setTimeout(() => { done(); }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.state.getValue()).toEqual(StompState.CLOSED);
    });
  });

  describe('should disconnect even when underlying connection is not there', () => {
    // Simulate error on WebSocket and wait for while and call disconnect
    beforeEach((done) => {
      disconnetStompRAndEnsure(rxStomp, done);
    });

    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of reconnect delay)
    beforeEach((done) => {
      rxStomp.deactivate();
      setTimeout(() => { done(); }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.state.getValue()).not.toEqual(StompState.CONNECTED);
    });
  });
});
