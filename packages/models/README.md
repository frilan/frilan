# @frilan/models

This package contains Typeorm entities definitions, that can be used by both servers and clients.

- [Installation](#installation)
  * [Prerequisites](#prerequisites)
  * [Building](#building)
- [Development](#development)
  * [File watcher](#file-watcher)
  * [Code linting](#code-linting)

## Installation

### Prerequisites

Setup Node.js 16 and install dependencies from the repository **root** by running `npm install`. Note that all npm commands, further described below, should be run from the repository root as well.

### Building

Run the following commands:
```sh
npm run build -w @frilan/models
```

This will build the package into two version: one with ES modules (for clients), one with CommonJS modules (for servers). you can choose to build either one of those by running one of the following commands:
```sh
npm run build:esm -w @frilan/models
npm run build:cjs -w @frilan/models
```

## Development

### File watcher

To automatically rebuild the code on change, run:
```sh
npm run watch -w @frilan/console
```

Just as with the build script, you can also select a single kind of module:
```sh
npm run watch:esm -w @frilan/models
npm run watch:cjs -w @frilan/models
```

### Code linting

To lint the code and fix errors, run:
```sh
npm run lint:fix -w @frilan/console
```
