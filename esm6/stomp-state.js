/**
 * Possible states for the STOMP service
 */
export var StompState;
(function (StompState) {
    StompState[StompState["CLOSED"] = 0] = "CLOSED";
    StompState[StompState["TRYING"] = 1] = "TRYING";
    StompState[StompState["CONNECTED"] = 2] = "CONNECTED";
    StompState[StompState["DISCONNECTING"] = 3] = "DISCONNECTING";
})(StompState || (StompState = {}));
//# sourceMappingURL=stomp-state.js.map