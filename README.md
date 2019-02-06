# fullstack-one - A database centric GraphQL Framework
PostgreSQL, Node.js, GraphQL, TypeScript, API Framework

## Features / Planned features

*We are using PostgreSQL for:*
  * Authentication and Authorization
  * Relation oriented and document oriented data
  * Queues (SKIP LOCKED, e.g. PGBoss)
  * Versioning of rows
  * Events through NOTIFY
  * JS Common modules
  * running JS functions in Postgres
  * full text search


## Installation

An examplary application, that is based on the fullstack-one framework, can be found in the [example](examples/fullstack-one-example).


## Setup local development

fullstack-one consists of multiple packages bundled in this monorepo based on [lerna](https://github.com/lerna/lerna/). All packages can be found [here](packages).

Install root packages:

```sh
npm install
```

In order to install the dependencies of the packages and link the packages to each other run:

```sh
npm run lerna-bootstrap
```

## Install new dependencies to a local package

Use lerna's [add](https://github.com/lerna/lerna/tree/master/commands/add) command.

## Publish packages

```sh
npm run lerna-publish
```
