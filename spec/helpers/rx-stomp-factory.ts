/* tslint:disable:no-unused-variable */

import { RxStomp, RxStompConfig } from '../../src';

export function defaultConfig(): RxStompConfig {
  return {
    // Which server?
    url: 'ws://127.0.0.1:15674/ws',

    // Comment above and uncomment below to test with SockJS
    // url: socketProvider,

    // Headers
    // Typical keys: login, passcode, host
    headers: {
      login: 'guest',
      passcode: 'guest'
    },

    // How often to heartbeat?
    // Interval in milliseconds, set to 0 to disable
    heartbeat_in: 0, // Typical value 0 - disabled
    heartbeat_out: 0, // Typical value 20000 - every 20 seconds

    // Wait in milliseconds before attempting auto reconnect
    // Set to 0 to disable
    // Typical value 5000 (5 seconds)
    reconnect_delay: 200,

    // Will log diagnostics on console
    debug: true
  };
}

export class MyRxStomp extends RxStomp {
  /**
   * This method closes the underlying WebSocket, simulating a close due to an error
   */
  public forceDisconnect(): void {
    this.stompClient.forceDisconnect();
  }
}

// Wait till RxStomp is actually connected
export function rxStompFactory () {
  const rxStomp = new MyRxStomp();
  rxStomp.config = defaultConfig();
  rxStomp.initAndConnect();
  return rxStomp;
}
