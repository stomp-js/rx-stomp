/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import {RxStomp, StompState} from '../../src';

export function ensureStompConnected(rxStomp: RxStomp, done: any) {
  rxStomp.connectObservable.subscribe((state: StompState) => {
    done();
  });
}

export function ensureStompRDisconnected (rxStomp: RxStomp, done: any) {
  rxStomp.state.subscribe((state: StompState) => {
    if (state === StompState.CLOSED) {
      done();
    }
  });
}

export function  disconnetStompRAndEnsure(rxStomp: RxStomp, done: any) {
  rxStomp.disconnect();
  ensureStompRDisconnected(rxStomp, done);
}
