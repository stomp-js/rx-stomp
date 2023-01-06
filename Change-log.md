# Change Log

## 2.0.0-beta1

- Compatibility with Node 18.
- Switch to `rollup` from `webpack`.
- `Karma`/`Jasmine` upgraded to use `rollup`.
- Cleanup and update dependencies.
- Jasmine test cases use `async` wherever possible.
- Update `RxJS` imports as per `RxJS 7.2` recommendations.
- Deprecate unmaintained `angular2-uuid` in favor of `uuid`.
  Fixes [#461](https://github.com/stomp-js/rx-stomp/issues/461).
- Use package type `module` in package.json exports.
- Exports a few symbols from @stomp/stompjs.
  Fixes [#416](https://github.com/stomp-js/rx-stomp/issues/416).
- Depend on @stomp/stompjs@7.0.0-beta2.
- Add `force` option to `deactivate`.
- Documentation tidying and grammar corrections.
- Deprecate ng2-stompjs.
- No longer use Travis CI.

## 1.2.0 (2022-11-10)

Introduce the error correlation feature.
See [#470](https://github.com/stomp-js/rx-stomp/pull/470) and the new optional config property `correlateErrors`.

## 1.1.4 (2021-08-28)

- Pin typescript less than 3.7, v1.1.3 had mistakenly relaxed it.

## 1.1.3 (2021-08-28)

- Pass all params with modified header,
  see [#394](https://github.com/stomp-js/rx-stomp/issues/394).
- Since source is not included, exclude source maps from npm package.

## 1.1.2 (2020-04-18)

- Restrict typescript to 3.6.x.

## 1.1.1 (2020-04-18)

- Fix issues with RPC with custom reply queue
  [#327](https://github.com/stomp-js/rx-stomp/pull/327).

## 1.1.0 (2020-03-14)

- Allow subHeaders to be a callback
  [#299](https://github.com/stomp-js/rx-stomp/pull/299),
  fixes [#298](https://github.com/stomp-js/rx-stomp/issues/298).

## 1.0.2 (2020-02-24)

- Update dependency for "@stomp/stompjs" to ">=6.1.0".

## 1.0.1 (2020-10-22)

- Update dependency for "@stomp/stompjs" to "^6.0.0".

## 1.0.0 (2020-10-22)

- Switch to `es2015` output target.
  Resolves [#259](https://github.com/stomp-js/stompjs/issues/259).
- Update to `@stomp/stompjs@6.x`.
- Add `connectionTimeout` config opti…on.
- Rely on `Client#deactivate` to be async to simplify `RxStomp#deactivate`
- Allow setting unsubscribe headers,
  see [#24](https://github.com/stomp-js/rx-stomp/issues/24)
  and [#254](https://github.com/stomp-js/rx-stomp/pull/254).
- Option to subscribe only once, i.e., to not auto resubscribe.
  see [#5](https://github.com/stomp-js/rx-stomp/issues/5)
  and [#254](https://github.com/stomp-js/rx-stomp/pull/254).
- Concept of `discardWebsocketOnCommFailure`.
- Update documentation links as per new URL structure without dates.

## 0.3.5 (2020-04-05)

- Pass `client` to beforeConnect callback.
  Fixes [#204](https://github.com/stomp-js/rx-stomp/issues/204).

## 0.3.4 (2019-10-10)

- Fix webpack config - window not defined in nodejs.
- Expose `active` property.

## 0.3.3 (2019-08-22)

- Support for user supplied correlation id in RxStompRPC.
  Fixes [#129](https://github.com/stomp-js/rx-stomp/issues/129).

## 0.3.2 (2019-06-12)

- Supports `stompjs@5.4.2`.

## 0.3.1 (2019-06-02)

- Updates in contributing guidelines.
- Mark streams as ReadOnly in RxStomp.
  See [rx-stomp/pull/93](https://github.com/stomp-js/rx-stomp/pull/93).
  Many thanks [Ray Booysen](https://github.com/raybooysen).
- Option to not enqueue a message if broker is not connected.
  See [rx-stomp/pull/94](https://github.com/stomp-js/rx-stomp/pull/94).
  Many thanks [Ray Booysen](https://github.com/raybooysen).

## 0.3.0-beta.1 (2019-01-20)

- Promote 0.3.0-beta.1 to 0.3.0

## 0.3.0-beta.1 (2019-01-17)

- Expose options from @stomp/stompjs@5.2.0 -
  splitLargeFrames and forceBinaryWSFrames.

## 0.2.0 (2019-01-10)

- None.

## 0.2.0-beta.1 (2018-12-24)

- Update "@stomp/stompjs" dependency to 5.1.0.
- Travis build - test ng2-stompjs with current build.
- Travis build - test lint as well.
- beforeConnect supports async callbacks.
- Update to IFrame, IMessage, ITransaction interfaces.
- Concept of unhandledFrame$ and webSocketError$.
- Support for logRawCommunication, fixes
  [rx-stomp/issues/25](https://github.com/stomp-js/rx-stomp/issues/25)
- Update other dependencies to latest versions.
- On a reconnect - ensure subscriptions are established before
  publishing outstanding messages.
  Fixes [rx-stomp/issues/4](https://github.com/stomp-js/rx-stomp/issues/4)

## 0.1.1 (2018-11-26)

- Update @stomp/stompjs to 5.0.2.
- Align constant values in RxStompState with WebSocket.
  Fixes [stomp-js/rx-stomp#7](https://github.com/stomp-js/rx-stomp/issues/7).
- Updated reference to samples and documents.

## 0.1.0 (2018-11-12)

- Documentation

## 0.1.0-beta.5 (2018-11-10)

- Change in packaging, UMD is now default.

## 0.1.0-beta.4 (2018-11-02)

- Rolled back beta.3
- Align with underlying library: waitForReceipt --> watchForReceipt

## 0.1.0-beta.3 (2018-10-30)

- Failed, rolled back

## 0.1.0-beta.2 (2018-10-28)

- Uses @stomp/stompjs v5 properly
- Initial documentation
- Refactors and renames
- tslint clean
- Refactored specs

## 0.1.0-beta.1 (2018-10-13)

- Factored out from https://github.com/stomp-js/ng2-stompjs
- Build/test/doc systems are working
- Travis is setup
