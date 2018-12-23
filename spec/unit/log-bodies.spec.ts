import {take} from 'rxjs/operators';

import 'jasmine';

import {RxStomp} from '../../src';

import {disconnectRxStompAndEnsure} from '../helpers/helpers';
import {defaultConfig} from '../helpers/rx-stomp-factory';

describe('Log Bodies', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach((done) => {
    disconnectRxStompAndEnsure(rxStomp, done);
    rxStomp = null;
  });

  it('should trigger webSocketErrors$', (done) => {
    const queueName = '/topic/ng-demo-sub';

    // Text picked up from https://github.com/stomp-js/stomp-websocket/pull/46
    const body = 'Älä sinä yhtään and السابق';
    // client.logRawCommunication = true;

    const debug = jasmine.createSpy('debug');

    rxStomp = new RxStomp();
    rxStomp.configure(defaultConfig());

    rxStomp.configure({debug, logRawCommunication: true});

    rxStomp.watch(queueName).subscribe(() => {
      expect(debug.calls.mostRecent().args[0]).toMatch(body);
      done();
    });

    rxStomp.activate();

    rxStomp.connected$.pipe(take(1)).subscribe(() => {
      rxStomp.publish({destination: queueName, body});
      expect(debug.calls.mostRecent().args[0]).toEqual(
        '>>> SEND\ndestination:/topic/ng-demo-sub\ncontent-length:37\n\nÄlä sinä yhtään and السابق' + '\0');
    });

  });
});
