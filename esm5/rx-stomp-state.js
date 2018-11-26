"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Possible states for the RxStomp
 *
 * Prat of `@stomp/rx-stomp`
 */
var RxStompState;
(function (RxStompState) {
    RxStompState[RxStompState["CONNECTING"] = 0] = "CONNECTING";
    RxStompState[RxStompState["OPEN"] = 1] = "OPEN";
    RxStompState[RxStompState["CLOSING"] = 2] = "CLOSING";
    RxStompState[RxStompState["CLOSED"] = 3] = "CLOSED";
})(RxStompState = exports.RxStompState || (exports.RxStompState = {}));
//# sourceMappingURL=rx-stomp-state.js.map