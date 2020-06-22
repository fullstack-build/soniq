# soniq - A PostgreSQL centric GraphQL Framework
soniq is a battery included Node.js GraphQL framework created on top of PostgreSQL written in TypeScript, with focus on high performance, flexibility and security.
> PostgreSQL, Node.js, TypeScript, GraphQL, DI

**min. Node.js Version: 12.17** 
AsyncLocalStorage: https://nodejs.org/docs/latest-v12.x/api/async_hooks.html#async_hooks_class_asynclocalstorage

## Features
  * Dependency Injection
  * Logging
  * Configuration (Environments)
  * DB Access (Postgres only with connection pools)
  * Events (PG is used as an event bus)
  * Authentication and Authorization
  * DB Migrations
  * Relation oriented and document oriented data
  * Queue (Build with PG SKIP LOCKED by PGBoss)
  * Server (Koa)
  * Auditing
  * GraphQL API (solved n+1 Problem)
  * File Storage (Any S3 Server)
