import { StompHeaders } from '@stomp/stompjs';

export interface IWatchParams {
  readonly destination?: string;
  readonly subHeaders?: StompHeaders;
  readonly unsubHeaders?: StompHeaders | (() => StompHeaders);
  readonly noAutoResubscribe?: boolean;
}
