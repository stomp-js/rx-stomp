import { Observable } from 'rxjs';
import { IMessage, publishParams } from '@stomp/stompjs';
import { RxStomp } from './rx-stomp';
import { RxStompRPCConfig } from './rx-stomp-rpc-config';
/**
 * An implementation of Remote Procedure Call (RPC) using messaging.
 *
 * Please see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
 *
 * Part of `@stomp/rx-stomp`
 */
export declare class RxStompRPC {
    private rxStomp;
    private stompRPCConfig?;
    private _replyQueueName;
    private _setupReplyQueue;
    private _repliesObservable;
    /**
     * Create an instance, see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
     */
    constructor(rxStomp: RxStomp, stompRPCConfig?: RxStompRPCConfig);
    /**
     * Make an RPC request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html) for example.
     */
    rpc(params: publishParams): Observable<IMessage>;
    /**
     * Make an RPC stream request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html).
     */
    stream(params: publishParams): Observable<IMessage>;
}
