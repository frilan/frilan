# @frilan/api

A server providing a REST API running on Node.js.

- [Installation](#installation)
  * [Prerequisites](#prerequisites)
  * [Environment variables](#environment-variables)
  * [Starting the server](#starting-the-server)
- [Usage](#usage)
  * [Loading relations](#loading-relations)
- [Development](#development)
  * [Development server](#development-server)
  * [Code linting](#code-linting)
- [Database](#database)
  * [Entities](#entities)
  * [Migrations](#migrations)

## Installation

### Prerequisites

Setup and start a PostgreSQL 13 server and create a new database.

Setup Node.js 16 and install dependencies from the repository **root** by running `npm install`. Note that all npm commands, further described below, should be run from the repository root as well.

- [Installation](#installation)
  * [Prerequisites](#prerequisites)
  * [Environment variables](#environment-variables)
  * [Starting the server](#starting-the-server)
- [Usage](#usage)
  * [Loading relations](#loading-relations)
- [Development](#development)
  * [Development server](#development-server)
  * [Code linting](#code-linting)
- [Database](#database)
  * [Entities](#entities)
  * [Migrations](#migrations)

### Environment variables

Define the following variables accordingly:
| Variable | Description | Default |
| --- | --- | --- |
| `HTTP_HOST` | the host name to listen on | any address |
| `HTTP_PORT` | the port to listen on | 8080 |
| `DB_HOST` | the database host name | localhost |
| `DB_PORT` | the database port | 5432 |
| `DB_NAME` | the database name | frilan |
| `DB_USER` | the database username | postgres |
| `DB_PASS` | the database password |

### Starting the server

Run the following commands:
```sh
npm run build -w @frilan/api
npm start -w @frilan/api
```

## Usage

The API endpoints are documented directly in the source code, following the [OpenAPI Specification](https://swagger.io/specification/). To get a list of all endpoints and their documentation, start the server and navigate to the `/docs` path in a browser.

### Loading relations

With endpoints that return a resource, you can include related resources in the response by using the `load` query parameter.
```http
GET /users?load=registrations
```

Multiple relations can be specified.
```http
GET /event/3?load=registrations,tournaments
```

Nested relations are also supported.
```http
GET /tournaments/21?load=teams,teams.members
```

## Development

### Development server

To start a development server, run:
```sh
npm run dev -w @frilan/api
```

This package depends on [@frilan/models](../models) and its type declarations. You can automatically watch for changes and recompile the models by running:
```sh
npm run watch:cjs -w @frilan/models
```

### Code linting

To lint the code and fix errors, run:
```sh
npm run lint:fix -w @frilan/api
```

## Database

All the data is stored in a relational PostgreSQL database. The tables and relations can be visualized [here](https://drawsql.app/frilan/diagrams/frilan).

This project uses [Typeorm](https://typeorm.io) to query the database and manage migrations. The Typeorm CLI can be used by running:
```sh
npm run typeorm [args...] -w @frilan/api
```

### Entities

Entities are not part of this package; they are defined in [@frilan/models/entities](../models/src/entities). That way, they can be shared among different packages.

Entities must be compiled into CommonJS modules in order to be imported by the API. This is done initially when running `npm install`. To compile entities manually, run:
```sh
npm run build:cjs -w @frilan/models
```

### Migrations

Database migrations can be automatically generated from the entities source code. When entities are updated, a new migration must be generated by running:
```sh
npm run mig:gen <name> -w @frilan/api
```

Migrations are automatically run when starting the server. To manually run the migrations, use:
```sh
npm run mig:run -w @frilan/api
```