
# Transactional mutations

This is my preferred solution for nested, transactional mutations:

## Full example (Usecase 1.3)

We want to be able to create an (two/three/more) entries to two tables and connect these entries in an NM-table.

```
mutation {
  beginTransaction(isolationLevel: REPEATABLE_READ)

  createIngredient(input: {
    name: "Cheese and Onion"
  }, returnId: "$ingredientId")

  firstBaseIngredient: createBaseIngredient(input: {
    name: "Cheese"
  }, returnId: "$firstBaseIngredientId")

  secondBaseIngredient: createBaseIngredient(input: {
    name: "Onion"
  }, returnId: "$secondBaseIngredientId")

  createBaseIngredientInIngredient(input: {
    ingredientId: "$ingredientId",
    baseIngredientId: "$firstBaseIngredientId"
  })

  createBaseIngredientInIngredient(input: {
    ingredientId: "$ingredientId",
    baseIngredientId: "$secondBaseIngredientId"
  })

  endTransaction()
}
```

## Custom mutations

If we define custom mutations there should be an option to define if the mutation is able to use a dbclient in a transaction or not:

Schema:
```
extend type Mutation {
  myCustomMutation(someInputId: ID!): Boolean @custom(resolver: "myCustomResolver", doesAcceptClientTransaction: true)
}
```

If a custom mutation can work with a given client we can use it with other mutations in one transaction:

```
mutation {
  beginTransaction()

  createIngredient(input: {
    name: "Cheese and Onion"
  }, returnId: "$ingredientId")

  myCustomMutation(someInputId: "$ingredientId")

  endTransaction()
}
```

If you do this and `doesAcceptClientTransaction` is `false` or `null` this will throw an error and rollback the transaction.

## Pro's / Con's (Compared to nested mutations in prisma)

+ Clear order of execution
+ Much simpler to implement
+ Its possible to combine generated and custom mutations
+ Simpler to use (from my point of view)
- Well, it's not nested ;-)
- Can't be combined with queries (I cannot query a id by something else and use it directly in a mutation => Prisma can, hovever I think the use-cases for that are limited)
- Variable-template syntax can be invalid even when the syntax is valid by gql-definition. (Check only on server)