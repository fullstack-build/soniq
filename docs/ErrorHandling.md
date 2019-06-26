# ErrorHandling in Custom Mutations

## 1. Throw a normal Error:

You can throw any error like this:

```js
async (obj, args, context, info, params) => {
  throw new Error("My Error");
}
```

- The logger will log this with `logger.error` including the full stacktrace
- The user will receive `INTERNAL_SERVER_ERROR`


## 2. Throw an AuthenticationError:

Throw this, when the user is not authenticated at all

```js
import { AuthenticationError } from "@fullstack-one/graphql";

async (obj, args, context, info, params) => {
  throw new AuthenticationError("My Error");
}
```

- The logger will log this with `logger.trace` including the full stacktrace
- The user will receive `UNAUTHENTICATED`


## 3. Throw a ForbiddenError:

Throw this, when the user is authenticated but not allowed to access that resource

```js
import { ForbiddenError } from "@fullstack-one/graphql";

async (obj, args, context, info, params) => {
  throw new ForbiddenError("My Error");
}
```

- The logger will log this with `logger.trace` including the full stacktrace
- The user will receive `FORBIDDEN`


## 4. Throw an UserInputError:

Throw this, when some input form the user is invalid or broken.

```js
import { UserInputError } from "@fullstack-one/graphql";

async (obj, args, context, info, params) => {
  throw new UserInputError("My Error");
}
```

- The logger will log this with `logger.trace` including the full stacktrace
- The user will receive `BAD_USER_INPUT`


## 5. Throw an UserInputError and expose details:

Throw this, when some input form the user is invalid or broken and you want to tell him, what is wrong

```js
import { UserInputError } from "@fullstack-one/graphql";

async (obj, args, context, info, params) => {
  const error = new UserInputError("My Error");
  error.extensions.exposeDetails = true;
  throw error;
}
```

- The logger will log this with `logger.trace` including the full stacktrace
- The user will receive `BAD_USER_INPUT` including the message `"My Error"`