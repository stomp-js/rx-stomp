import { publishParams } from '@stomp/stompjs';
export interface IExtendedPublishParams extends publishParams {
    retryIfDisconnected?: boolean;
}
