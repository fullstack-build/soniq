
# Nested (transactional) mutations

This document is ment to explore the need of nested mutations. A user may want to create/update/delete multiple entities within one transaction. Currently ONE is not able to fulfill this. We will describe some User-Stories, which depend on transactional mutations and find some solutions to solve them without creating custom mutations.

## 1) Create mutation examples:

### 1.1) Create mulitple posts (All or nothing)

#### Description

We want to create multiple posts. However, if one fails, all should fail.

#### Normal mutations

First we create a user, returning a ID:

```gql
mutation {
  firstPost: createPost(input: {
    title: "First Post"
  })
  secondPost: createPost(input: {
    title: "Second Post"
  })
}
```

### 1.2) Create a user and a person

#### Description

We want to be able to register a user while creating a second entity (naturalperson/company).

#### Normal mutations

First we create a user, returning a ID: After this mutation the user is logged in.

```gql
mutation {
  createUser(input: {
    email: "karl.napf@fullstack.build"
  })
}
```

Result:
```
{
  "data": {
    "createUser": "1111"
  }
}
```

Then we create a person containing the userId:
(This example is without any return parameters to simplify it)

```
mutation {
  createPerson(input: {
    name: "Karl Napf",
    userId: "1111"
  })
}
```


### 1.3) Create an ingredient and (one/two/many) baseIngredients and a NM-Entry

#### Description

We want to be able to create an (two/three/more) entries to two tables and connect these entries in an NM-table.

#### Normal mutations

First we create the base entries.

```gql
mutation {
  createIngredient(input: {
    name: "Cheese and Onion"
  })
  firstBaseIngredient: createBaseIngredient(input: {
    name: "Cheese"
  })
  secondBaseIngredient: createBaseIngredient(input: {
    name: "Onion"
  })
}
```

Result:
```
{
  "data": {
    "createIngredient": "1111",
    "firstBaseIngredient": "2222",
    "secondBaseIngredient": "3333"
  }
}
```

Then we create multiple NM-Entries:
(This example is without any return parameters to simplify it)

```
mutation {
  createBaseIngredientInIngredient(input: {
    ingredientId: "1111",
    baseIngredientId: "2222"
  })
  createBaseIngredientInIngredient(input: {
    ingredientId: "1111",
    baseIngredientId: "3333"
  })
}
```

## 2) Update mutation examples

### 2.1) All or nothing update of multiple entities

#### Description

We want to be able to create an (two/three/more) entries to two tables and connect these entries in an NM-table.

#### Normal mutations

First we create the base entries.

```gql
mutation {
  firstBaseIngredient: updateIngredient(input: {
    id: "1111",
    name: "New Cheese"
  })
  secondBaseIngredient: updateBaIngredient(input: {
    id: "2222",
    name: "New Onion"
  })
}
```

Result:
```
{
  "data": {
    "updateIngredient": "1111",
    "updateBaIngredient": "2222"
  }
}
```

### 2.2) Create a new Email

#### Description

We want to create a new Email, connect it to a user and delete the old one.

#### Normal mutations

1) First we need to find the old email-ID:

```gql
{
  users {
    id
    email {
      id
      name
    }
  }
}
```

Result:
```
{
  "data": {
    "users": [
      {
        "id": "1111",
        "email": {
          "id": "2222",
          "name": "dustin@fullstack.build"
        }
      }
    ]
  }
}
```

2) Then create a new one.

```gql
mutation {
  createEmail (input: {
    name: "dustin2@fullstack.build"
  })
}
```

Result:
```
{
  "data": {
    "createEmail": "3333"
  }
}
```

3) Replace the email-ID (FK) in user entity.

```gql
mutation {
  updateUser (input: {
    id: "1111",
    emailId: "3333"
  })
}
```

Result:
```
{
  "data": {
    "updateUser": "1111"
  }
}
```

3) In the end we remove the old email.

```gql
mutation {
  deleteEmail (input: {
    id: "2222"
  })
}
```

Result:
```
{
  "data": {
    "deleteEmail": "2222"
  }
}
```
