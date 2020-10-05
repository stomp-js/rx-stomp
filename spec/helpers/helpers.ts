/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import { RxStomp, RxStompState } from '../../src';
import { filter, take } from 'rxjs/operators';

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

export function disconnectRxStompAndEnsure(rxStomp: RxStomp, done: () => void) {
  rxStomp.deactivate();
  ensureRxStompDisconnected(rxStomp, done);
}

export function forceDisconnectAndEnsure(rxStomp: RxStomp, done: () => void) {
  rxStomp.connected$.pipe(take(1)).subscribe(() => {
    rxStomp.stompClient.forceDisconnect();
    rxStomp.connectionState$
      .pipe(
        filter(state => {
          return state === RxStompState.CLOSED;
        }),
        take(1)
      )
      .subscribe(() => {
        done();
      });
  });
}
