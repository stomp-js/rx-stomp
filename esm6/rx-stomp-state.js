/**
 * Possible states for the RxStomp
 *
 * Prat of `@stomp/rx-stomp`
 */
export var RxStompState;
(function (RxStompState) {
    RxStompState[RxStompState["CLOSED"] = 0] = "CLOSED";
    RxStompState[RxStompState["CONNECTING"] = 1] = "CONNECTING";
    RxStompState[RxStompState["OPEN"] = 2] = "OPEN";
    RxStompState[RxStompState["CLOSING"] = 3] = "CLOSING";
})(RxStompState || (RxStompState = {}));
//# sourceMappingURL=rx-stomp-state.js.map