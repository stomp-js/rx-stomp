/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import {StompRService, StompState} from '../../src';

export function ensureStompConnected(stompService: StompRService, done: any) {
  stompService.connectObservable.subscribe((state: StompState) => {
    done();
  });
}

export function ensureStompRDisconnected (stompService: StompRService, done: any) {
  stompService.state.subscribe((state: StompState) => {
    if (state === StompState.CLOSED) {
      done();
    }
  });
}

export function  disconnetStompRAndEnsure(stompService: StompRService, done: any) {
  stompService.disconnect();
  ensureStompRDisconnected(stompService, done);
}
