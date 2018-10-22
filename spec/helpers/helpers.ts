/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import {RxStomp, StompState} from '../../src';

export function ensureStompConnected(rxStomp: RxStomp, done: any) {
  rxStomp.connected$.subscribe((state: StompState) => {
    done();
  });
}

export function ensureStompRDisconnected(rxStomp: RxStomp, done: any) {
  rxStomp.connectionState$.subscribe((state: StompState) => {
    if (state === StompState.CLOSED) {
      done();
    }
  });
}

export function  disconnetStompRAndEnsure(rxStomp: RxStomp, done: any) {
  rxStomp.deactivate();
  ensureStompRDisconnected(rxStomp, done);
}
