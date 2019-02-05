# @fullstack-one/cli
CLI tool to fasten development with fullstack one

## Installation

Via npm:

```sh
npm install @fullstack-one/cli
```

## Commands

### --help

Get cli help for the commands:

```sh
one --help
one [command] --help
```

### init

Initializes a fullstack one project.

```sh
one init
```


### migrate-db

Utilizes @fullstack-one/auto-migrate to migrate the database according to the schema definitions.

```sh
one migrate-db
```


### generate-ts

Generates typescript interfaces, enums and types based on the dbMeta object derived from the schema definitions.

```sh
one generate-ts
```