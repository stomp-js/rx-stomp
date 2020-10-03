/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import { RxStomp, RxStompState } from '../../src';

export function ensureRxStompConnected(rxStomp: RxStomp, done: any) {
  rxStomp.connected$.subscribe((state: RxStompState) => {
    done();
  });
}

export function ensureRxStompDisconnected(rxStomp: RxStomp, done: any) {
  rxStomp.connectionState$.subscribe((state: RxStompState) => {
    if (state === RxStompState.CLOSED) {
      done();
    }
  });
}

export function disconnectRxStompAndEnsure(rxStomp: RxStomp, done: any) {
  rxStomp.deactivate();
  ensureRxStompDisconnected(rxStomp, done);
}
