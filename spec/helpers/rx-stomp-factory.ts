/* tslint:disable:no-unused-variable */

import { RxStomp, RxStompConfig } from '../../src';

export function defaultConfig(): RxStompConfig {
  return {
    // Which server?
    brokerURL: 'ws://127.0.0.1:15674/ws',

    // Comment above and uncomment below to test with SockJS
    // url: socketProvider,

    // Headers
    // Typical keys: login, passcode, host
    connectHeaders: {
      login: 'guest',
      passcode: 'guest'
    },

    // How often to heartbeat?
    // Interval in milliseconds, set to 0 to disable
    heartbeatIncoming: 0, // Typical value 0 - disabled
    heartbeatOutgoing: 0, // Typical value 20000 - every 20 seconds

    // Wait in milliseconds before attempting auto reconnect
    // Set to 0 to disable
    // Typical value 5000 (5 seconds)
    reconnectDelay: 200,

    // Will log diagnostics on console
    debug: (msg: string): void => {
      console.log(new Date(), msg);
    }
  };
}

// Wait till RxStomp is actually connected
export function rxStompFactory() {
  const rxStomp = new RxStomp();
  rxStomp.configure(defaultConfig());
  rxStomp.activate();
  return rxStomp;
}
