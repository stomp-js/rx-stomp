# RxStomp

[![Build Status](https://travis-ci.org/stomp-js/rx-stomp.svg?branch=master)](https://travis-ci.org/stomp-js/rx-stomp)

This library provides an RxJS oriented STOMP over WebSocket client for Web browser and node.js
applications.

Please visit https://stomp-js.github.io/ for guides, FAQs and API docs.

# Introduction

This library allows you to connect to a STOMP broker over WebSocket. This library
supports complete STOMP specifications including all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets out-of-the-box
or using plugins.

This library uses https://github.com/stomp-js/stompjs under the hood.

## Features

- Simple API to interact with the Stomp protocol
- Support for v1.2, v1.1 and v1.0 of the Stomp protocol
- Support for fallback options in case of WebSocket unavailable
- Browser and Node.js support
- Option to use STOMP over TCP
- Binary payload support
- Suitable for usage with long-running applications, pages, and SPAs.

## TypeScript definitions

The npm package includes TypeScript definitions, so there is no need to install it separately.

## Usage

### Browser

```html
<script type="importmap">
  {
    "imports": {
      "@stomp/rx-stomp": "https://ga.jspm.io/npm:@stomp/rx-stomp@2.0.0/esm6/index.js"
    },
    "scopes": {
      "https://ga.jspm.io/": {
        "@stomp/stompjs": "https://ga.jspm.io/npm:@stomp/stompjs@7.0.0/esm6/index.js",
        "rxjs": "https://ga.jspm.io/npm:rxjs@7.8.0/dist/esm5/index.js",
        "tslib": "https://ga.jspm.io/npm:tslib@2.5.0/modules/index.js",
        "uuid": "https://ga.jspm.io/npm:uuid@9.0.0/dist/esm-browser/index.js"
      }
    }
  }
  </script>

<!-- ES Module Shims: Import maps polyfill for modules browsers without import maps support (all except Chrome 89+) -->
<script async src="https://ga.jspm.io/npm:es-module-shims@1.5.1/dist/es-module-shims.js" crossorigin="anonymous"></script>

<script type="module">
  import { RxStomp } from "@stomp/rx-stomp";

  const rxStomp = new RxStomp();
  rxStomp.configure({
    brokerURL: 'ws://localhost:15674/ws',
  });

  rxStomp.activate();

  const subscription = rxStomp
    .watch({ destination: "/topic/test-rx" })
    .subscribe((message) => console.log(message.body));

  rxStomp.publish({
    destination: "/topic/test-rx",
    body: "First message to RxStomp",
  });

  setTimeout(async () => {
    subscription.unsubscribe();
    await rxStomp.deactivate();
  }, 3000);
</script>
```

### NodeJS

```bash
$ npm install @stomp/rx-stomp ws
```

```javascript
import { RxStomp } from "@stomp/rx-stomp";
import { WebSocket } from 'ws';

Object.assign(global, { WebSocket});

const rxStomp = new RxStomp();
rxStomp.configure({
  brokerURL: 'ws://localhost:15674/ws',
});

rxStomp.activate();

const subscription = rxStomp
  .watch({ destination: "/topic/test-rx" })
  .subscribe((message) => console.log(message.body));

rxStomp.publish({
  destination: "/topic/test-rx",
  body: "First message to RxStomp",
});

setTimeout(async () => {
  subscription.unsubscribe();
  await rxStomp.deactivate();
}, 3000);
```

## Further information

See [https://stomp-js.github.io/](https://stomp-js.github.io/) for instructions and tutorials.

See samples at: [https://github.com/stomp-js/samples/](https://github.com/stomp-js/samples/).

API documentation at:
[https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html](https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html).

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
