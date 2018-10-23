/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import {RxStomp, StompState} from '../../src';

export function ensureRxStompConnected(rxStomp: RxStomp, done: any) {
  rxStomp.connected$.subscribe((state: StompState) => {
    done();
  });
}

export function ensureRxStompDisconnected(rxStomp: RxStomp, done: any) {
  rxStomp.connectionState$.subscribe((state: StompState) => {
    if (state === StompState.CLOSED) {
      done();
    }
  });
}

export function disconnectRxStompAndEnsure(rxStomp: RxStomp, done: any) {
  rxStomp.deactivate();
  ensureRxStompDisconnected(rxStomp, done);
}
