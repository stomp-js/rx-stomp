import {skip, take} from 'rxjs/operators';

import 'jasmine';

import {RxStomp} from '../../src';

import {disconnectRxStompAndEnsure} from '../helpers/helpers';
import {defaultConfig} from '../helpers/rx-stomp-factory';

describe('Connection', () => {
  let rxStomp: RxStomp;

  // Disconnect and wait till it actually disconnects
  afterEach((done) => {
    disconnectRxStompAndEnsure(rxStomp, done);
    rxStomp = null;
  });

  it('should call beforeConnect', (done) => {
    rxStomp = new RxStomp();
    rxStomp.configure(defaultConfig());

    const beforeConnect = jasmine.createSpy();
    rxStomp.configure({beforeConnect});

    rxStomp.activate();

    // Disconnect so that it reconnects
    rxStomp.connected$.pipe(take(1)).subscribe(() => {
      expect(beforeConnect).toHaveBeenCalled();
      rxStomp.stompClient.forceDisconnect();
    });

    // When it reconnects, beforeConnect should be called again
    rxStomp.connected$.pipe(skip(1), take(1)).subscribe(() => {
      expect(beforeConnect.calls.count()).toEqual(2);
      done();
    });
  });
});
