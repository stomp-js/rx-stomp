import { StompConfig } from './stomp-config';

import { RxStomp } from './rx-stomp';

/**
 * Angular2 STOMP Service using @stomp/stomp.js
 *
 * @description This service handles subscribing to a
 * message queue using the stomp.js library, and returns
 * values via the ES6 Observable specification for
 * asynchronous value streaming by wiring the STOMP
 * messages into an observable.
 *
 * If you want to manually configure and initialize the service
 * please use StompRService
 */
export class StompService extends RxStomp {

  /**
   * Constructor
   *
   * See README and samples for configuration examples
   */
  public constructor(config: StompConfig) {
    super();

    this.config = config;
    this.initAndConnect();
  }
}
