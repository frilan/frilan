# @frilan/console

The Console is a client application that provides a user interface to manage and register to tournaments.

- [Installation](#installation)
  * [Prerequisites](#prerequisites)
  * [Environment variables](#environment-variables)
  * [Building](#building)
- [Development](#development)
  * [Development server](#development-server)
  * [Bundle visualiser](#bundle-visualiser)
  * [Code linting](#code-linting)

## Installation

### Prerequisites

Setup Node.js 16 and install dependencies from the repository **root** by running `npm install`. Note that all npm commands, further described below, should be run from the repository root as well.

### Environment variables

Define the following variables accordingly:
| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | the base URL of the [@frilan/api](../api) server | http://localhost:8080 |

### Building

Run the following commands:
```sh
npm run build -w @frilan/console
```

This will generate a bundle, which will be available in the `build` folder. You can easily serve the bundled client locally to your browser by running:
```sh
npm run serve -w @frilan/console
```

## Development

### Development server

To start a development server, run:
```sh
npm run dev -w @frilan/console
```

This package depends on [@frilan/models](../models) and its type declarations. You can automatically watch for changes and recompile the models by running:
```sh
npm run watch:cjs -w @frilan/models
```

### Bundle visualiser

To visualise the size of each module in the bundle, run:
```sh
npm run stats -w @frilan/console
```

### Code linting

To lint the code and fix errors, run:
```sh
npm run lint:fix -w @frilan/console
```
