/**
 * Possible states for the RxStomp
 *
 * Part of `@stomp/rx-stomp`
 */
export var RxStompState;
(function (RxStompState) {
    RxStompState[RxStompState["CONNECTING"] = 0] = "CONNECTING";
    RxStompState[RxStompState["OPEN"] = 1] = "OPEN";
    RxStompState[RxStompState["CLOSING"] = 2] = "CLOSING";
    RxStompState[RxStompState["CLOSED"] = 3] = "CLOSED";
})(RxStompState || (RxStompState = {}));
//# sourceMappingURL=rx-stomp-state.js.map