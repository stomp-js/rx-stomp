/* tslint:disable:no-unused-variable */

import "jasmine";

import { RxStomp, StompState, RxStompConfig } from '../../src';

import { defaultConfig, MyRxStomp } from '../helpers/rx-stomp-factory';
import { ensureStompConnected, disconnetStompRAndEnsure, ensureStompRDisconnected } from '../helpers/helpers';

describe('RxStomp disconnect', () => {
  let rxStomp: MyRxStomp;
  const rxStompConfig: RxStompConfig = defaultConfig();

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });

  // Wait till RxStomp is actually connected
  beforeEach((done) => {
    rxStomp = new MyRxStomp();
    rxStomp.config = rxStompConfig;
    rxStomp.initAndConnect();
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
      rxStomp.disconnect();
      setTimeout(() => { done(); }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.state.getValue()).toEqual(StompState.CLOSED);
    });
  });

  describe('should disconnect even when underlying connection is not there', () => {
    // Simulate error on Websocket and wait for while and call disconnect
    beforeEach((done) => {
      disconnetStompRAndEnsure(rxStomp, done);
    });

    // Ask RxStomp to disconnect and wait for 500 ms (more than double
    // of reconnect delay)
    beforeEach((done) => {
      rxStomp.disconnect();
      setTimeout(() => { done(); }, 500);
    });

    it('and not reconnect', () => {
      expect(rxStomp.state.getValue()).not.toEqual(StompState.CONNECTED);
    });
  });
});
