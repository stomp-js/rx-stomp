"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Possible states for the RxStomp
 */
var RxStompState;
(function (RxStompState) {
    RxStompState[RxStompState["CLOSED"] = 0] = "CLOSED";
    RxStompState[RxStompState["CONNECTING"] = 1] = "CONNECTING";
    RxStompState[RxStompState["OPEN"] = 2] = "OPEN";
    RxStompState[RxStompState["CLOSING"] = 3] = "CLOSING";
})(RxStompState = exports.RxStompState || (exports.RxStompState = {}));
//# sourceMappingURL=rx-stomp-state.js.map