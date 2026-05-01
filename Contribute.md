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
- `rollup` for bundling - https://rollupjs.org/
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
├── bundles/                 -- Generated UMD bundles for browsers (generated)
├── esm6/                    -- Generated ES2020 modules (generated)
├── index.d.ts
├── package-lock.json
├── package.json
├── rabbitmq/
│   └── Dockerfile           -- Builds a Docker image used to run tests
├── rollup.config.mjs        -- Rollup bundler configuration
├── spec/                    -- Test cases
│   ├── helpers/             -- Shared test utilities and factory functions
│   ├── karma.conf.js        -- Karma test runner configuration
│   └── unit/                -- Test cases using Jasmine
├── src/                     -- TypeScript sources
└── tsconfig.json
```

## Setup a Stomp broker

- A Stomp broker is used for running the tests. I have been using RabbitMQ.
- Edit `spec/helpers/rx-stomp-factory.ts` as per
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
clean   - Remove generated build artifacts (bundles/, esm6/)
build   - Compile TypeScript to esm6/ and bundle to bundles/
karma   - Run tests in browsers (Chrome and Firefox headless)
lint    - Run eslint
prettier - Format source files
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
1. Documentation is generated centrally for `stompjs` and `rx-stomp`.
   Follow required https://compodoc.app/ standards in comments.

### Creating a Pull Request

1. Please exclude generated files from the commit
   (`bundles` and `esm6` folders).
   These will be generated during merge and release process.
1. Please ensure that following passes successfully:
   ```bash
   $ npm run lint
   $ npm run karma
   ```
1. Please follow GitHub guidelines to raise a PR against `develop` branch.
1. GitHub actions will run tests against a freshly installed RabbitMQ.
1. Raise an issue if you are unclear.
