# lovefield-ts
[![Build Status](https://travis-ci.org/arthurhsu/lovefield-ts.svg?branch=master)](
https://travis-ci.org/arthurhsu/lovefield-ts)

Lovefield Typescript port and modernization.

The port attempts to maintain API compatibility with original Lovefield. As a
result, some parts may conflict with TypeScript best practice (e.g. interface
name must start with capital I).

## Port progress

1. Move all files to use Typescript (in progress, almost done):
  [Detailed port progress can be found here](https://docs.google.com/spreadsheets/d/10m_fW8lPfiFzbgXsW8tbE5im5EUmYuvA10NzJhY1xwQ/edit?usp=sharing).

2. Design dist mechanism and publish npm package (not started)
3. Release and improve upon, [tracked by issues](https://github.com/arthurhsu/lovefield-ts/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

## Expectations

### Supported

* Most of original Lovefield features (except Firebase and static schema).
* NEW: NodeJS support: NodeJS 7+ will be supported (with memory store only
  initially).

### Unsupported

* Legacy browsers and technologies. Please assume ES6 throughout.
  * As of July 2018, Chrome 60+, Firefox 60+, Safari 10+, Edge are supported.
  * Official release may require even newer browser version.
* Firebase is no longer supported.
  * This project is not sponsored by Google and the developers do not have
    unlimited access for this project.
  * Firebase API changed and legacy Lovefield code cannot be used.

### Maybe supported

* Static schema: it was designed for use with Closure compiler. Since the tool
  chain has moved to TypeScript, it makes no sense to support it unless there
  are real-world demands.

## Building and development instructions

The project is set to use modern Typescript (2.8+) and Mocha/Chai/Sinon/Karma as
its test framework. Compilation/test speed has improved significantly.

The dist and release mechanism is not developed yet.

### Development set up

* Install Chrome
* Install Node 9+
* `npm install`
* `node node_modules/guppy-cli/bin/index.js pre-commit`

### Development flow

Run `gulp` to see the commands.

Please note that certain tests are only runnable in Karma (e.g. IndexedDB
related tests), and these tests will be named *_spec.ts.

### Directory structures

* `lib`: Lovefield main library source code
* `testing`: Facility code used for testing
* `tests`: Tests for Lovefield main library
* `out`: Temporary directory used to store intermediate files from tool chain
* `coverage`: Code coverage report
