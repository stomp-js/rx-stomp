/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import {RxStomp, StompState} from '../../src';

export function ensureStompConnected(stompService: RxStomp, done: any) {
  stompService.connectObservable.subscribe((state: StompState) => {
    done();
  });
}

export function ensureStompRDisconnected (stompService: RxStomp, done: any) {
  stompService.state.subscribe((state: StompState) => {
    if (state === StompState.CLOSED) {
      done();
    }
  });
}

export function  disconnetStompRAndEnsure(stompService: RxStomp, done: any) {
  stompService.disconnect();
  ensureStompRDisconnected(stompService, done);
}
