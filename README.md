# RxStomp

[![Build Status](https://travis-ci.org/stomp-js/rx-stomp.svg?branch=master)](https://travis-ci.org/stomp-js/rx-stomp)

[![Verified on Openbase](https://badges.openbase.com/js/verified/@stomp/rx-stomp.svg?token=oUE0YKV87LJXAWQpGG0YUN698is0r2/WmS2qM7TLz9U=)](https://openbase.com/js/@stomp/rx-stomp?utm_source=embedded&amp;utm_medium=badge&amp;utm_campaign=rate-badge)

This library provides an RxJS oriented STOMP over WebSocket client for Web browser and node.js
applications.

# Introduction

This is a wrapper over https://github.com/stomp-js/stompjs.
It exposes the STOMP operations as RxJS Observables.
It provides almost all operations provided by the underlying library.

This has been developed using TypeScript and includes typing information in the distribution.

## TypeScript definitions

The npm package includes TypeScript definitions, so there is no need to install it separately.

## Installation

The library is distributed as UMD and ES6 modules.
This can be installed as an npm module or directly from a CDN:

1.  NPM - `npm install @stomp/rx-stomp`
2.  Yarn - `yarn add @stomp/rx-stomp`
3.  Script - available on various CDNs, import both rx-stomp and stompjs

TODO: Add instructions and link to sample for v2.0.0

Additionally, rxjs > 7.2.0 needs to be installed.

## Usage

See [https://stomp-js.github.io/](https://stomp-js.github.io/) for instructions and tutorials.

This module is distributed as UMD and ES6 modules:

- ES6/typescript `import`
- including a script tage in HTML.
- NodeJs - Starting with v2, this library is distributed as ES modules only.

See samples at: [https://github.com/stomp-js/samples/](https://github.com/stomp-js/samples/).

API documentation at:
[https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html](https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html).

Before installing please check:
[https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html](https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html).

## Change-log

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
- [Matt Critchlow](https://github.com/vigie)
- Everyone involved at https://github.com/stomp-js/stompjs

## License

[License](LICENSE) - Apache-2.0
