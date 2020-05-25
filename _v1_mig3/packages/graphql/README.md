# @fullstack-one/graphql

## Introduction

### Purpose

The `@fullstack-one/graphql` package extends the Koa app provided by `@fullstack-one/server` by GraphQl resolver middleware. Thereby it uses custom application resolvers (specified by a Glob in the config) and default resolvers for GraphQl Mutations and Queries. The default resolvers enable the application to provide basic SELECT, CREATE, UPDATE and DELETE Apis out-of-the-box by translating GraphQl requests to SQL statements guaranteeing application-defined permissions on relations and fields. A major part of this package is devoted to the solution of the N+1 problem of the object-relational mapping domain.

### N+1 Problem and its solution

In object-relational mapping, the `n+1 problem` is a typical issue. It is described more in detail on [stackoverflow.com](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping). Effectively it means, to fetch a list of objects and their property objects, e.g. cars and all their wheels, from a relational database, one request is needed to get the list of cars and for each of the N cars a request is needed to get its wheels. `@fullstack-one/graphql` solves this problem by translating nested GraphQl queries into nested SQL statements using subqueries. The solution can be found in the [code](lib/getDefaultResolvers/QueryBuilder). 


## Usage

### General

At its core `@fullstack-one/graphql` only needs its configuration according to the [default config and config type](config) and booting. Given that the `@fullstack-one/server` and `@fullstack-one/schema-builder` run properly, `@fullstack-one/graphql` should do its job.

```ts
import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GraphQl } from "@fullstack-one/graphql";

const graphQl = Container.get(GraphQl);
Container.get(BootLoader).boot();
```

### Hooks

`@fullstack-one/graphql` provides the possibility to define hooks on GraphQl Query or Mutation requests (only applied on default resolvers provided by this package). Hooks may be used for additional database operations. There are three kinds of hooks:
- Pre Query
- Pre Mutation Commit
- Post Mutation Commit

They can be added using the GraphQl Service, i.e.:
```ts
import { Container } from "@fullstack-one/di";
import { GraphQl } from "@fullstack-one/graphql";

const graphQl: GraphQl = Container.get(GraphQl);

graphQl.addPreQueryHook(...);
graphQl.addPreMutationCommitHook(...);
graphQl.addPostMutationCommitHook(...);
```

Find more usage details in the [code](lib).

### Errors and logging

All thrown errors in resolvers will be logged by `logger.error(error)`.

By default all Errors will be catched and converted to an `ApolloError` with the code `INTERNAL_SERVER_ERROR`.

You can expose an error by creating an `UserInputError` like this:

```ts
import { UserInputError } from "@fullstack-one/graphql"; 

function myResolver() {
  throw new UserInputError("Something special went wrong.", { exposeDetails: true, some: "details" });
}
```

If the user is not authenticated, you should throw an `AuthenticationError` like this:

```ts
import { AuthenticationError } from "@fullstack-one/graphql"; 

function myResolver() {
  throw new AuthenticationError("Please login first.");
}
```

If the user is authenticated, but not permitted for this action you should throw an `ForbiddenError` like this:

```ts
import { ForbiddenError } from "@fullstack-one/graphql"; 

function myResolver() {
  throw new ForbiddenError("You cannot do this.");
}
```

If the message of an error-object contains one of the following strings, the error will be converted to the corresponding error object:

```
"AUTH.THROW.USER_INPUT_ERROR"
"AUTH.THROW.AUTHENTICATION_ERROR"
"AUTH.THROW.FORBIDDEN_ERROR"
```


## Examples

Examples can be found in the [tests](test).
