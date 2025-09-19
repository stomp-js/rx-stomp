/* tslint:disable:no-unused-variable */

import 'jasmine';

// Helper functions
import { RxStomp, RxStompState } from '../../src';
import { filter, firstValueFrom } from 'rxjs';

export async function ensureRxStompConnected(rxStomp: RxStomp) {
  await firstValueFrom(rxStomp.connected$);
}

export async function ensureRxStompDisconnected(rxStomp: RxStomp) {
  await firstValueFrom(
    rxStomp.connectionState$.pipe(
      filter((state: RxStompState) => state === RxStompState.CLOSED),
    ),
  );
}

export async function disconnectRxStompAndEnsure(rxStomp: RxStomp) {
  await rxStomp.deactivate();
}

export async function forceDisconnectAndEnsure(rxStomp: RxStomp) {
  await ensureRxStompConnected(rxStomp);
  rxStomp.stompClient.forceDisconnect();
  await ensureRxStompDisconnected(rxStomp);
}

export const wait = (timeToDelay: number) =>
  new Promise(resolve => setTimeout(resolve, timeToDelay));
