
# Nested (transactional) mutations

Here we evaluate some possible solutions for the nested mutation use-cases.

# Basic requirements:

I discovered two major requirements:

A) Passing an ID from a create mutation to any other mutation or query
B) Transactions over root mutations

## Solutions for A (Passing variables)

I only came to the solution of passing variables by templating inside ID fields. However there are still some decisions to make:

### Which template style?

First we have to decide which template style to use.
This doesn't really matter since we can clearly distinguish between an uuid and some template.
Here are some examples:

1) `${myVar}`
2) `{myVar}`
3) `{{myVar}}`
4) `<myVar>`
5) `$myVar`

I like 5) because it is like a GQL input variable and you can easily parse it by checking and removing the first letter.

### How to define the variable name

#### 1) Use alias as variable with some templating

In this example we create a new ingredient, a baseIngredient and connect them with BaseIngredientInIngredient

```
mutation {
  baseIngredientId: createBaseIngredient(input: {
    name: "Zwiebeln"
  })

  ingredientId: createIngredient(input: {
    name: "Zwiebelsauce"
  })

  createBaseIngredientInIngredient(input: {
    baseIngredientId: "$baseIngredientId",
    ingredientId: "$ingredientId"
  })
}
```

+ No extra input variables
- Cloud get broken when used with batching

#### 2) Use extra input as variable with some templating

In this example we create a new ingredient, a baseIngredient and connect them with BaseIngredientInIngredient

```
mutation {
  createBaseIngredient(input: {
    name: "Zwiebeln"
  }, exportIdVariable: "baseIngredientId")

  createIngredient(input: {
    name: "Zwiebelsauce"
  }, exportIdVariable: "ingredientId")

  createBaseIngredientInIngredient(input: {
    baseIngredientId: "$baseIngredientId",
    ingredientId: "$ingredientId"
  })
}
```

+ Would work with query matching
- Extra input variable required on every generated create mutation

## Solutions for B (transactions)

### 1.1) Transaction input variable (boolean)

```
mutation {
  createBaseIngredient(input: {
    name: "Zwiebeln"
  }, transaction: true)

  createIngredient(input: {
    name: "Zwiebelsauce"
  }, transaction: true)
}
```

+ Very simple to use
- Not usable with batch mutations
- Hard to implement (We need to detect the start and the end of the transaction)

### 1.2) Transaction input variable (string)

```
mutation {
  createBaseIngredient(input: {
    name: "Zwiebeln"
  }, transaction: "myAmazingTransaction")

  createIngredient(input: {
    name: "Zwiebelsauce"
  }, transaction: "myAmazingTransaction")
}
```

+ Very simple to use
o Usable with batch mutations, however collitions are possible
- Hard to implement (We need to detect the start and the end of the transaction)

### 2) Start/End-transaction mutations

```
mutation {
  beginTransaction()

  createBaseIngredient(input: {
    name: "Zwiebeln"
  })

  createIngredient(input: {
    name: "Zwiebelsauce"
  })

  endTransaction()
}
```

+ Fully usable with batch mutations
+ No extra input fields required
+ With `startTransaction` we could change the pg transaction mode
+ Easy to implement (start and end is clear)
- Hard to implement (We need to detect the start and the end of the transaction)