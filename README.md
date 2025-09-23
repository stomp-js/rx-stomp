# RxStomp

[![Build Status](https://travis-ci.org/stomp-js/rx-stomp.svg?branch=master)](https://travis-ci.org/stomp-js/rx-stomp)

An RxJS-friendly STOMP-over-WebSocket client for the Web and Node.js.

- Guides, FAQs, and API docs: https://stomp-js.github.io/
- Samples: https://github.com/stomp-js/samples/
 
# Introduction
 
This library allows you to connect to a STOMP broker over WebSocket. This library
supports complete STOMP specifications including all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets out-of-the-box
or using plugins.
 
This library uses https://github.com/stomp-js/stompjs under the hood.
 
## Features
 
- Simple, RxJS-oriented API
- STOMP v1.2, v1.1, and v1.0
- Auto-reconnect with configurable strategies
- Browser and Node.js support
- Optional STOMP-over-TCP via custom socket factories
- Text and binary payloads
- Heartbeats and connection health hooks
- Production-friendly for long-running apps and SPAs
 
## TypeScript definitions
 
The npm package includes TypeScript definitions, so there is no need to install it separately.
 
## Usage
 
### Browser
 
```html
<script type="importmap">
  {
    "imports": {
      "@stomp/rx-stomp": "https://ga.jspm.io/npm:@stomp/rx-stomp@2.0.1/esm6/index.js"
    },
    "scopes": {
      "https://ga.jspm.io/": {
        "@stomp/stompjs": "https://ga.jspm.io/npm:@stomp/stompjs@7.0.0/esm6/index.js",
        "rxjs": "https://ga.jspm.io/npm:rxjs@7.8.1/dist/esm5/index.js",
        "tslib": "https://ga.jspm.io/npm:tslib@2.6.2/modules/index.js",
        "uuid": "https://ga.jspm.io/npm:uuid@9.0.1/dist/esm-browser/index.js"
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
 
Notes:
- For bundlers (Vite, Webpack, Rollup), prefer installing via npm and importing from "@stomp/rx-stomp".
- The example above uses JSPM import maps for quick demos without a build step.
 
### NodeJS
 
```bash
$ npm install @stomp/rx-stomp ws
```
 
```javascript
import { RxStomp } from "@stomp/rx-stomp";
import { WebSocket } from 'ws';
 
Object.assign(global, { WebSocket });
 
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
 
Tips:
- Node.js does not provide a global WebSocket by default; the snippet above wires the 'ws' package into global scope for compatibility.
- If you prefer not to patch global, provide a factory:
  ```javascript
  import { RxStomp } from "@stomp/rx-stomp";
  import { WebSocket } from "ws";
  const rxStomp = new RxStomp();
  rxStomp.configure({
    webSocketFactory: () => new WebSocket("ws://localhost:15674/ws"),
  });
  rxStomp.activate();
  ```
 
### TypeScript quick start
 
```typescript
import { RxStomp, RxStompConfig } from "@stomp/rx-stomp";
 
const config: RxStompConfig = {
  brokerURL: "ws://localhost:15674/ws",
  reconnectDelay: 2000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
};
 
const rxStomp = new RxStomp();
rxStomp.configure(config);
rxStomp.activate();
 
const sub = rxStomp.watch({ destination: "/topic/news" }).subscribe(msg => {
  console.log("News:", msg.body);
});
```
 
## Further information
 
See [https://stomp-js.github.io/](https://stomp-js.github.io/) for instructions and tutorials.
 
See samples at: [https://github.com/stomp-js/samples/](https://github.com/stomp-js/samples/).
 
API documentation at:
[https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html](https://stomp-js.github.io/api-docs/latest/classes/RxStomp.html).
 
## Troubleshooting
 
- Connection retries: tune `reconnectDelay`, `maxReconnectDelay`, and `reconnectTimeMode`.
- Heartbeats: set `heartbeatIncoming`/`heartbeatOutgoing` to detect stale connections.
- Binary payloads: use `binaryBody` and set an appropriate `content-type`.
- React Native issue: see [https://stomp-js.github.io/workaround/stompjs/rx-stomp/react-native-additional-notes.html](https://stomp-js.github.io/workaround/stompjs/rx-stomp/react-native-additional-notes.html).
- SockJS issues: see [https://stomp-js.github.io/guide/stompjs/rx-stomp/using-stomp-with-sockjs.html](https://stomp-js.github.io/guide/stompjs/rx-stomp/using-stomp-with-sockjs.html).
 
## Change-log
 
Please visit [Change Log](Change-log.md).
 
## Contributing
 
If you want to understand the code, develop, or contribute. Please visit
[How to contribute](Contribute.md).
 
## Authors
 
- [Sam Finnigan](https://github.com/sjmf)
- [Jimi (Dimitris) Charalampidis](https://github.com/JimiC)
- [Deepak Kumar](https://github.com/kum-deepak)
- [Astha Deep](https://github.com/astha183)
- [Michel Promonet](https://github.com/mpromonet)
- [Ray Booysen](https://github.com/raybooysen)
- [Matt Critchlow](https://github.com/vigie)
- [Ivan](https://github.com/akaNightmare)
- Everyone involved at https://github.com/stomp-js/stompjs
 
## License
 
[License](LICENSE) - Apache-2.0
