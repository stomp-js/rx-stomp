/* tslint:disable:no-unused-variable */

import 'jasmine';

import { StompHeaders } from '@stomp/stompjs';

import { RxStomp } from '../../src';

import { disconnectRxStompAndEnsure } from '../helpers/helpers';
import { rxStompFactory } from '../helpers/rx-stomp-factory';

describe('Connection', () => {
  let rxStomp: RxStomp;

  // Wait till RxStomp is actually connected
  beforeEach(() => {
    rxStomp = rxStompFactory();
  });

  // Disconnect and wait till it actually disconnects
  afterEach(done => {
    disconnectRxStompAndEnsure(rxStomp, done);
    rxStomp = null;
  });

  it('should be active', () => {
    expect(rxStomp.active).toBe(true);
  });

  it('should connect', done => {
    rxStomp.connected$.subscribe(() => {
      done();
    });
  });

  it('should receive server headers', done => {
    rxStomp.serverHeaders$.subscribe((headers: StompHeaders) => {
      // Check that we have received at least one key in header
      expect(Object.keys(headers).length).toBeGreaterThan(0);

      // Subscribe again, we should get the same set of headers
      // (as per specifications, if STOMP has already connected it should immediately trigger)
      rxStomp.serverHeaders$.subscribe((headers1: StompHeaders) => {
        expect(headers1).toEqual(headers);
        done();
      });
    });
  });
});
