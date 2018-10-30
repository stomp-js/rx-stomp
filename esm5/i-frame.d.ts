import { StompHeaders } from '@stomp/stompjs';
/**
 * Many callbacks/Observables return instance of a Frame.
 * It has been created as an interface to avoid type compatibility issues.
 * Typescript does not consider two Objects to be of compatible types if these differ in private fields.
 */
export interface IFrame {
    /**
     * STOMP Command
     */
    command: string;
    /**
     * Headers, key value pairs.
     */
    headers: StompHeaders;
    /**
     * Whether this frame has binary body
     */
    isBinaryBody: boolean;
    /**
     * body of the frame
     */
    body: string;
    /**
     * body as Uint8Array
     */
    binaryBody: Uint8Array;
}
