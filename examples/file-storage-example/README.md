# Usage

## 1. Create a User

Create a user with email `franz@fullstack.build` and password `test1234`.

```
mutation {
  beginTransaction

  USER_CREATE_ME(
    input: {
      name: "Karl Napf"
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

## 2. Login

Using the above email and password.

```
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

