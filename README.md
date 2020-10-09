# RxStomp

[![Build Status](https://travis-ci.org/stomp-js/rx-stomp.svg?branch=master)](https://travis-ci.org/stomp-js/rx-stomp)

This library provides a RxJS oriented STOMP over WebSocket client for Web browser or node.js
applications.

# Introduction

This is a wrapper over https://github.com/stomp-js/stompjs.
It exposes the STOMP operations as RxJS Observables.
It provides almost all operations provided by the underlying library.

This has been developed using TypeScript and includes typing information in the distribution.

## TypeScript definitions

The npm package includes TypeScript definitions, so there is no need no install it separately.

## Installation

The library is distributed as UMD and can be used in various methods:

1.  NPM - `npm install @stomp/rx-stomp`
2.  Yarn - `yarn add @stomp/rx-stomp`
3.  Script - available on various CDNs, import both rx-stomp and stomp

Additionally, rxjs^6.0 needs to be installed.

## Usage

This module is distributed as UMD, this allows usage easy from NodeJs `require`,
ES6/typescript `import` or directly including as script in HTML.

See samples at: [https://github.com/stomp-js/samples/](https://github.com/stomp-js/samples/).

API documentation at:
[https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html](https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html).

Before installing please check:
[https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/2018/06/28/pollyfils-for-stompjs-v5.html](https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/2018/06/28/pollyfils-for-stompjs-v5.html).

## Change log

Please visit [Change Log](Change-log.md).

## Contributing

If you want to understand the code, develop, or contribute. Please visit
[How to contribute](Contribute.md).

## Authors

- [Sam Finnigan](https://github.com/sjmf)
- [Jimi (Dimitris) Charalampidis](https://github.com/JimiC)
- [Deepak Kumar](https://github.com/kum-deepak)
- Astha Deep
- [Michel Promonet](https://github.com/mpromonet)
- [Ray Booysen](https://github.com/raybooysen)
- Everyone involved at https://github.com/stomp-js/stomp-websocket
  and https://github.com/stomp-js/stompjs

## License

[License](LICENSE) - Apache-2.0
