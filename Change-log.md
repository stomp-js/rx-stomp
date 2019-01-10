# Change Log

## 0.2.0 (2019-01-10)

* None.

## 0.2.0-beta.1 (2018-12-24)

* Update "@stomp/stompjs" dependency to 5.1.0.
* Travis build - test ng2-stompjs with current build.
* Travis build - test lint as well.
* beforeConnect supports async callbacks.
* Update to IFrame, IMessage, ITransaction interfaces.
* Concept of unhandledFrame$ and webSocketError$.
* Support for logRawCommunication, fixes 
  [rx-stomp/issues/25](https://github.com/stomp-js/rx-stomp/issues/25)
* Update other dependencies to latest versions.
* On a reconnect - ensure subscriptions are established before
  publishing outstanding messages.
  Fixes [rx-stomp/issues/4](https://github.com/stomp-js/rx-stomp/issues/4)

## 0.1.1 (2018-11-26)

* Update @stomp/stompjs to 5.0.2.
* Align constant values in RxStompState with WebSocket.
  Fixes [stomp-js/rx-stomp#7](https://github.com/stomp-js/rx-stomp/issues/7).
* Updated reference to samples and documents.

## 0.1.0 (2018-11-12)

* Documentation

## 0.1.0-beta.5 (2018-11-10)

* Change in packaging, UMD is now default.

## 0.1.0-beta.4 (2018-11-02)

* Rolled back beta.3
* Align with underlying library: waitForReceipt --> watchForReceipt

## 0.1.0-beta.3 (2018-10-30)

* Failed, rolled back

## 0.1.0-beta.2 (2018-10-28)

* Uses @stomp/stompjs v5 properly
* Initial documentation
* Refactors and renames
* tslint clean
* Refactored specs 

## 0.1.0-beta.1 (2018-10-13)

* Factored out from https://github.com/stomp-js/ng2-stompjs
* Build/test/doc systems are working
* Travis is setup
