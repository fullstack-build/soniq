# @fullstack-one/graphql

## Tasks

Before booting phase the GraphQl service ...
- ... extends `@fullstack-one/schema-builder`'s schema by operators

In the booting phase the GraphQl service ...
- ... loads resolver definitions from application folders
- ... does some confusing stuff with resolvers `prepareSchema()` and `getResolvers()`
- ... gets the enriched SDL string, the database meta object and the resolver meta object from `@fullstack-one/schema-builder`
- ... makes an executable schema
- ... adds routes of `@fullstack-one/server` for an GraphQl (and GraphiQl) endpoint using `apollo-koa-server` and the executable schema
