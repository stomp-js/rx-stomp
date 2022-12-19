// Karma configuration
// Generated on Thu Jul 05 2018 16:43:26 GMT+0530 (IST)

module.exports = function(config) {
  config.set({
    plugins: [
      require("@chiragrupani/karma-chromium-edge-launcher"),
      require("karma-chrome-launcher"),
      require("karma-firefox-launcher"),
      require("karma-jasmine"),
      require("karma-rollup-preprocessor"),
      require("karma-safari-launcher"),
      require("karma-summary-reporter")
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    files: ["src/**/*.ts", "spec/**/*.ts"],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "**/*.ts": "rollup"
    },

    rollupPreprocessor: {
      plugins: [
        require("@rollup/plugin-node-resolve")(),
        require("@rollup/plugin-commonjs")(),
        require("@rollup/plugin-sucrase")({
          exclude: ["node_modules/**"],
          transforms: ["typescript"],
        }),
      ],
      output: {
        format: "iife",
        name: "testcases",
        sourcemap: "inline",
      },
      external: "jasmine",
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeNoSandboxHeadless"],

    customLaunchers: {
      // See https://github.com/karma-runner/karma/issues/2603
      ChromeNoSandboxHeadless: {
        base: "Chrome",
        flags: [
          "--no-sandbox",
          // See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
          "--headless",
          "--disable-gpu",
          // Without a remote debugging port, Google Chrome exits immediately.
          " --remote-debugging-port=9222"
        ]
      },
      FirefoxHeadless: {
        base: "Firefox",
        flags: ["-headless"]
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 1
  });
};
