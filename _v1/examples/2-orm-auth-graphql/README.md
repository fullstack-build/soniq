# 2 ORM Auth and Graphql

## Create a User

Create a user with following transactional graphql mutation:
```graphql
mutation {
  beginTransaction

  USER_CREATE_ME(
    input: {
      firstname: "Karl"
      lastname: "Napf"
    },
    returnId: "$userId"
  )
  
  createPassword(password: "test1234", returnId: "$passwordCreationToken")
  createEmail(email: "franz@fullstack.build", returnId: "$emailCreationToken")
  createUserAuthentication(
    userId: "$userId",
    authFactorCreationTokens: ["$passwordCreationToken", "$emailCreationToken"],
    loginProviderSets: ["email", "password"],
    modifyProviderSets: ["email", "password"],
    isActive: true,
  )

  commitTransaction
}
```

Response:

```json
{
  "data": {
    "beginTransaction": "13050",
    "USER_CREATE_ME": "502fcc3f-056d-495d-9c23-87e906f65200",
    "createPassword": "Token hidden due to returnId usage.",
    "createEmail": "Token hidden due to returnId usage.",
    "createUserAuthentication": "a336b31c-b734-45ca-9f94-b82d46510318",
    "commitTransaction": "13050"
  }
}
```

## Login

Using the above email and password.

```graphql
mutation {
  beginTransaction
 
  getUserIdentifier(username: "franz@fullstack.build", tenant: "default", returnId: "$userIdentifier")
  proofPassword(userIdentifier: "$userIdentifier", password: "test1234", returnId: "$passwordProofToken")
  login(authFactorProofTokens: "$passwordProofToken") {
    refreshToken
    accessToken
    tokenMeta {
      userId
      issuedAt
      expiresAt
      providerSet
    }
  }

  commitTransaction
}
```
