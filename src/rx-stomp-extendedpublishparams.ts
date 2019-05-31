import { publishParams } from '@stomp/stompjs';

export interface IExtendedPublishParams extends publishParams {
    // * retryOnDisconnect determines if the message will be queued if the connection
    // * to the broker is down
    // * this defaults to true if not prrovided
    retryIfDisconnected?: boolean;
}
