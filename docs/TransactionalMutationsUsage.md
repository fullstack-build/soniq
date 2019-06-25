# Transactional Mutations Usage

## 1. Creating a custom mutation using the transactionQueryRunner

First define the schema:

```gql
extend type Mutation {
  createUser(name: String!): String! @custom(resolver: "createUser", usesQueryRunnerFromContext: true)
}
```

By setting the property `usesQueryRunnerFromContext = true` ONE will pass a queryRunner in `context._transactionQueryRunner`.
You will get this QueryRunner always. It doesn't matter if the user wraps your mutation with `beginTransaction` and `commitTransaction`.

Then you can define a resolver-function using the given QueryRunner:

```js
async (obj, args, context, info, params) => {
  const queryRunner = context._transactionQueryRunner;
  
  const rows = await queryRunner.query(`INSERT INTO "User"("name") VALUES($1) RETURNING "id";`, [args.name]);

  return rows[0].id;
}
```

## 2. Create a custom mutation with 3rd party integration and Rollback

First define the schema:

```gql
extend type Mutation {
  createStripeAccount(userId: ID!): ID! @custom(resolver: "createStripeAccount", usesQueryRunnerFromContext: true)
}
```

For this you also need to set the property `usesQueryRunnerFromContext = true`. This allows the mutation to run inside a transaction. You will also get the QueryRunner, however, you are not forced to use it. Instead you can return a `RevertibleResult`:

> Note: The Stripe-REST-Api is fake just to demonstrate the RevertivleResult

```js
async (obj, args, context, info, params) => {
  const result = await axios.post(`https://v1.api.stripe.com/users/account/${args.userId}`);

  const stripeAccountId = result.data.stripeAccountId;

  return new RevertibleResult(stripeAccountId, async () => {
    // Rollback function
    await axios.delete(`https://v1.api.stripe.com/users/account/${stripeAccountId}`);
  });
}
```

## 3. Passing a ReturnId

If you want to forward some returnId to another mutation you first have to add an optional field `returnId` to your mutation

> We are using the example from (1.)

```gql
extend type Mutation {
  createUser(name: String!, returnId: String): String! @custom(resolver: "createUser", usesQueryRunnerFromContext: true)
}
```

Now we will use the 6th parameter of our resolver-function `returnIdHandler`. With that we can just set the returnId for the following mutations.

```js
async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
  const queryRunner = context._transactionQueryRunner;
  
  const rows = await queryRunner.query(`INSERT INTO "User"("name") VALUES($1) RETURNING "id";`, [args.name]);

  returnIdHandler.setReturnId(rows[0].id);

  return rows[0].id;
}
```

If the user provides a `returnId` it will be set after this mutation.

## 4. Receiving a ReturnId

To receive a returnId you don't need to change the schema. We will use the schema of (2.).
Just use the method `getReturnId` from `returnIdHandler`. If no returnId is defined it will return the passed parameter.

```js
async (obj, args, context, info, params, returnIdHandler) => {
  const userId = returnIdHandler.getReturnId(args.userId);

  const result = await axios.post(`https://v1.api.stripe.com/users/account/${userId}`);

  const stripeAccountId = result.data.stripeAccountId;

  return new RevertibleResult(stripeAccountId, async () => {
    // Rollback function
    await axios.delete(`https://v1.api.stripe.com/users/account/${stripeAccountId}`);
  });
}
```

## 5. Usage in GQL

Here is an example client side transactional mutation using the mutations from (3.) and (4.).

Request:
```
mutation {
  beginTransaction

  createUser(name: "Karl", returnId: "$userId")

  createStripeAccount(userId: "$userId")

  commitTransaction
}
```

Response:
```
{
  data: {
    beginTransaction: "123456",
    createUser: "NEW_USER_ID",
    createStripeAccount: "NEW_ACCOUNT_ID",
    commitTransaction: "123456"
  }
}
```