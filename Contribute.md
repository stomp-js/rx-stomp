# Contributing

## How to contribute

- File issues.
- Edit/write documentation.
- Submit pull requests.
- Test in different environments.
- Raise awareness.

## Summary of tools

Following tools are getting used:

- `TypeScript` as primary language - https://www.typescriptlang.org/
- `compodoc` for API documentation - https://compodoc.app/
- `Jasmine` for test cases - https://jasmine.github.io/
- `Karma` for running test cases in browsers - http://karma-runner.github.io/
- `webpack` for build - https://webpack.js.org/
- `nodejs` during development - https://nodejs.org/
- `npm` for dependency management, packaging and distribution - https://www.npmjs.com/
- `git` for version control - https://git-scm.com/

## Initial setup

Instructions on setting up development environment:

- Install `node` and `npm` - https://nodejs.org/
- Checkout code from GitHub - you may fork the code first into your GitHub account.
- Use `npm i` to install dependencies:
  ```bash
  $ npm i
  ```

## Project structure

```text
<Project Folder>
├── LICENSE.md
├── README.md
├── bin/                     -- Scripts invoked from `npm` tasks
├── bundles/                 -- Generated code browsers
├── esm5/                    -- Generated ES5 modules
├── esm6/                    -- Generated ES6 modules
├── index.d.ts
├── karma.conf.js
├── package-lock.json
├── package.json
├── rabbitmq/
│   └── Dockerfile           -- This builds a docker image that is used to run test cases
├── spec/                    -- These test cases run both for nodejs (using just Jasmine) and Chrome (Jasmine/Karma)
│   ├── helpers/
│   └── unit/                -- Test cases using Jasmine
├── src/                     -- Typescript sources
├── tsconfig.json
└── webpack.config.js
```

## Setup a Stomp broker

- A Stomp broker is used for running the tests. I have been using RabbitMQ.
- Edit `spec/helpers/stomp.service.factory.ts` as per
  your setup. Defaults should work for as RabbitMQ default setup on localhost.
- Please note that in RabbitMQ you will need to enable Stomp and WebStomp plugins.
- By default RabbitMQ WebStomp will treat messages a text, you will need to tell
  it is use binary frames:
  ```bash
  $ echo 'web_stomp.ws_frame = binary' >> /etc/rabbitmq/rabbitmq.conf
  ```
- A RabbitMQ Dockerfile is provided with necessary plugins and configuration. To use it, run:
  ```bash
  $ docker build -t myrabbitmq rabbitmq/ # Needed only once
  $ docker run -d -p 15674:15674 myrabbitmq # to start the broker
  ```

## Building and testing

Key npm tasks:

```text
clean - Remove generated built artifacts
build-tsc - Internally used by `npm run build`
build-webpack - Internally used by `npm run build`
build - Build three variants - ES5, ES6, and UMD
karma - Run tests in browsers
lint - run tslint
```

### Basic development workflow

1. Checkout a new branch of `develop`.
1. Make code changes (src/specs)
1. Build:
   ```bash
   $ npm run build
   ```
1. Run tests:
   - To run tests using Headless Chrome:
     ```bash
     $ npm run karma
     ```
   - To run code style check
     ```bash
     $ npm run lint
     ```
1. Documentation is generated centrally for `stompjs`, `rx-stomp`
   and `ng2-stompjs`.
   Follow required https://compodoc.app/ standards in comments.

### Creating a Pull Request

1. Please exclude generated files from the commit
   (`bundles`, `esm5` and `esm6`) folders.
   These will be generated during merge and release process.
1. Please ensure that following passes successfully:
   ```bash
   $ npm run lint
   $ npm run karma
   ```
1. Please follow GitHub guidelines to raise a PR against `develop` branch.
1. Travis CI will run tests against a freshly installed RabbitMQ.
1. Travis CI will also test current `ng2-stompjs` against this build.
   Failing this part of the tests itself is not an issue, it only suggests
   that a coordinated release of both libraries might be needed.
1. Raise an issue if you are unclear.
