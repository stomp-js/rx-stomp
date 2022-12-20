import { firstValueFrom, take } from 'rxjs';

import 'jasmine';

import { RxStomp } from '../../src';

import { disconnectRxStompAndEnsure } from '../helpers/helpers';
import { defaultConfig } from '../helpers/rx-stomp-factory';

describe('Log Bodies', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach(async () => {
    await disconnectRxStompAndEnsure(rxStomp);
    rxStomp = null;
  });

  it('logs when logRawCommunication is set', async () => {
    const queueName = '/topic/ng-demo-sub';

    // Text picked up from https://github.com/stomp-js/stomp-websocket/pull/46
    const body = 'Älä sinä yhtään and السابق';

    const debug = jasmine.createSpy('debug');

    rxStomp = new RxStomp();
    rxStomp.configure(defaultConfig());

    rxStomp.configure({ debug, logRawCommunication: true });

    const retPromise = firstValueFrom(rxStomp.watch(queueName));

    rxStomp.activate();

    rxStomp.connected$.pipe(take(1)).subscribe(() => {
      rxStomp.publish({ destination: queueName, body });
      expect(debug.calls.mostRecent().args[0]).toEqual(
        '>>> SEND\ndestination:/topic/ng-demo-sub\ncontent-length:37\n\nÄlä sinä yhtään and السابق' +
          '\0'
      );
    });

    await retPromise;

    // There should at least two log statements containing the body
    // One for the outgoing message and another for the incoming message.
    expect(
      debug.calls
        .all()
        .map(c => c.args[0])
        .filter(v => v.match(body)).length
    ).toBeGreaterThanOrEqual(2);
  });
});
