# FriLAN [![CI](https://github.com/frilan/frilan/actions/workflows/ci.yml/badge.svg)](https://github.com/frilan/frilan/actions/workflows/ci.yml)

This repository contains all the packages required to run all FriLAN services.

- [@frilan/console](packages/console): a client application that organizers and players use to setup and register to tournaments.
- [@frilan/api](packages/api): a server providing a REST API that stores and manages the tournaments of each event.
- [@frilan/models](packages/models): typed classes that can be used by both servers and clients to handle common resources.

## Installation

**Requirement**: this project requires Node.js 16 and npm 7.7 or higher.

Navigate to the **root of the repository** and install all dependencies from all packages:
```sh
npm install
```

You can then setup, build and run each package individually, according to the documentation. See the README file of each package for more information.

## Development

In the repository root, you can run the following command to start **all dev servers** in parallel (one for each package):
```sh
npm run dev
```

To run the same script in every package at once, you can use the `-ws` option:
```sh
npm run build -ws
npm run lint:fix -ws
```
