"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Possible states for the STOMP service
 */
var StompState;
(function (StompState) {
    StompState[StompState["CLOSED"] = 0] = "CLOSED";
    StompState[StompState["TRYING"] = 1] = "TRYING";
    StompState[StompState["CONNECTED"] = 2] = "CONNECTED";
    StompState[StompState["DISCONNECTING"] = 3] = "DISCONNECTING";
})(StompState = exports.StompState || (exports.StompState = {}));
//# sourceMappingURL=stomp-state.js.map