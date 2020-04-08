
# Usage of the default local strategy

This tutorial is assuming you have defined a User-Entity-Type called `User` in the GQL-Definition and a permissions object with  `gqlTypeName: "User"`.

## Register user

### 1. Generate a privacy-token

Request:

```
mutation {
	createPrivacyAgreementAcceptanceToken(acceptedVersion: "0") {
    token
    acceptedVersion
    acceptedAtInUTC
  }
}
```


Response:

```
{
  "data": {
    "createPrivacyAgreementAcceptanceToken": {
      "token": "0i1Sn3V619u9UaG9YbK9x9aBxPw5d1muz0yp9QWWzmWaJMEQs5ckcMc6MeNU0RK98hyUACjfwS6jvqfazhQcr9snllDpeALekAbdeVzJlgdVeyqbXhwAGFGFj0JrMJgjbzzsuV0Lq8EVaixUGuOO7v6U2VK2jlPBF97ppzoT8c0DloB4a3uSvUq9Ck6QyZ0m6zms43hb6nqafW3vi793ROJtcn2MJIKpW3au68uE9Yafm57fvgotgOiWf6dnAhKGH75xeCMYDu76v7Po5RcqZ8brUbeu09oo5XIg5R97eqx6KxbXufRxmd4A71RhiqY3rzehNWxsHejdCisgW",
      "acceptedVersion": "0",
      "acceptedAtInUTC": "2019-04-11T13:01:35.946Z"
    }
  }
}
```

### 2. Create AuthFactorCreationTokens Email and Password

Request:

```
mutation {
  createPassword(password: "11111111")
  createEmail(email: "franz@fullstack.build")
}
```

Response:

```
{
  "data": {
    "createPassword": "0xWoN04pUoYWdhmkQJHbaVsFMIgQRG0Jt6Kjh8XWeNNfnMaeeANyTNgRavw8P5rLKKASc8Sl18m1A5HMCdfypkrbrg9TWPeOgxh06LzdpYenhv9K7KUZXdjLe3yWjcOqpkU5zs4u1ReiWm2ea0DlflQvd5La53DirYy7T98pjM0LhfpjDc4ebGyap4vhOKLVGM73Tqr3R60rwbiR6lYDqRagj7vTL7fg1M5loePqa5h6iXE4dAS2xeloZm0k6H6q2dbeKOB6dyzmvcYjeNf7iOg60oVtS0OoHVOfacVXGHx7KaoVSrgrzrrXUi5cAxJQ9BkgpEQ9SRcjmZ8fEMH7E9DPCXIR4V3oO635C9rocchwemIu818BB3cO4gsKGzM4mUp67tiMxmSVzax7plJ20Kbzs70h6RVOzkhUNuexhb7MzkkPfR5bkNc2H0rJslaeLq05wdAocMvJ7JMMcpl5dSsIaUbW5ekgF79WWhh83F6REtpd9eXGkJ0E5I3Dx2ocsPi5fg0r4iX44EzUvk8F523YqixMkahWfTSni1YdBE9evJ9f8nPb3iSDAHybbOhFy8Cc9By1pi2kEDn1xbeX3cjafsR7mawhVnjNmsfzICwHh23GAbmh",
    "createEmail": "0S55RrfmT8QTn4qYhtzDrjDbBkpN5V00h2tgDfjiLQF39KcDsGhb2wBn5z1Rl1pai417mhRjiQLJkVghOGveWmfSHghyqdVUKvoG4FJsVnF2U3IJ0V0vemqQJ2XnXDSUcPP4e4ohfYyqcK2w6Xacke06kRcF9AGG7cn8K5rBktaqGiSZ98O6l2UMeUWIEUo3v8odUb9a9ngZE8dGXlllhURjC7hcGTL3PJ7LuVIEdd2ZVmJEchE7ZiJbUjL6xPbl6WiI71HXA4VF0Ts8k64aTw9sVz7TP2ISS7aeurLhbuE2weE33UTHQt2omu8zWfltrepccsSUc780wpkmxPdUfEc1efjl5mj11ntbD1riYP0PglhMYRtLoaPZHOKBbGk2xna3MD8LFOhsOWULF3xAUXtGeuagn3x9oFsNoYaJX0bmk87j3immgQJ7krF8fNwfPse7sayZ33jzYxk0f6eZWfncsBvzVk1eKsNPueMiooVyccGhrhLfffM807gAYwYRS5PsNtkW1o7itBa2ILffd89jpNvfT6CQ1qcC5tfZxTg9x6jVECdneYFuCcvxSc0a7oSrLexhl64XJ22pqLZaM29kDrmxgqm2jkqe5oiwv6cC1vBu59VDlS0dbrUtsHbivbh3THedIeAxvh2zUJT6hr74AM70HdmYTyaTWFrTe85iqxGQ3hACCIx"
  }
}
```

### 3. Create a new user

Request:

```
mutation {
  USER_CREATE_ME(input: {
    email: "franz@fullstack.build",
    acceptedPrivacyTermsVersion: "0",
    acceptedPrivacyTermsAtInUTC: "2019-04-11T13:01:35.946Z"
  },
  loginProviderSets: ["email", "password"],
  modifyProviderSets: ["email", "password"],
  isActive: true,
  authFactorCreationTokens: ["0S55RrfmT8QTn4qYhtzDrjDbBkpN5V00h2tgDfjiLQF39KcDsGhb2wBn5z1Rl1pai417mhRjiQLJkVghOGveWmfSHghyqdVUKvoG4FJsVnF2U3IJ0V0vemqQJ2XnXDSUcPP4e4ohfYyqcK2w6Xacke06kRcF9AGG7cn8K5rBktaqGiSZ98O6l2UMeUWIEUo3v8odUb9a9ngZE8dGXlllhURjC7hcGTL3PJ7LuVIEdd2ZVmJEchE7ZiJbUjL6xPbl6WiI71HXA4VF0Ts8k64aTw9sVz7TP2ISS7aeurLhbuE2weE33UTHQt2omu8zWfltrepccsSUc780wpkmxPdUfEc1efjl5mj11ntbD1riYP0PglhMYRtLoaPZHOKBbGk2xna3MD8LFOhsOWULF3xAUXtGeuagn3x9oFsNoYaJX0bmk87j3immgQJ7krF8fNwfPse7sayZ33jzYxk0f6eZWfncsBvzVk1eKsNPueMiooVyccGhrhLfffM807gAYwYRS5PsNtkW1o7itBa2ILffd89jpNvfT6CQ1qcC5tfZxTg9x6jVECdneYFuCcvxSc0a7oSrLexhl64XJ22pqLZaM29kDrmxgqm2jkqe5oiwv6cC1vBu59VDlS0dbrUtsHbivbh3THedIeAxvh2zUJT6hr74AM70HdmYTyaTWFrTe85iqxGQ3hACCIx","0xWoN04pUoYWdhmkQJHbaVsFMIgQRG0Jt6Kjh8XWeNNfnMaeeANyTNgRavw8P5rLKKASc8Sl18m1A5HMCdfypkrbrg9TWPeOgxh06LzdpYenhv9K7KUZXdjLe3yWjcOqpkU5zs4u1ReiWm2ea0DlflQvd5La53DirYy7T98pjM0LhfpjDc4ebGyap4vhOKLVGM73Tqr3R60rwbiR6lYDqRagj7vTL7fg1M5loePqa5h6iXE4dAS2xeloZm0k6H6q2dbeKOB6dyzmvcYjeNf7iOg60oVtS0OoHVOfacVXGHx7KaoVSrgrzrrXUi5cAxJQ9BkgpEQ9SRcjmZ8fEMH7E9DPCXIR4V3oO635C9rocchwemIu818BB3cO4gsKGzM4mUp67tiMxmSVzax7plJ20Kbzs70h6RVOzkhUNuexhb7MzkkPfR5bkNc2H0rJslaeLq05wdAocMvJ7JMMcpl5dSsIaUbW5ekgF79WWhh83F6REtpd9eXGkJ0E5I3Dx2ocsPi5fg0r4iX44EzUvk8F523YqixMkahWfTSni1YdBE9evJ9f8nPb3iSDAHybbOhFy8Cc9By1pi2kEDn1xbeX3cjafsR7mawhVnjNmsfzICwHh23GAbmh"],
  privacyAgreementAcceptanceToken: "0i1Sn3V619u9UaG9YbK9x9aBxPw5d1muz0yp9QWWzmWaJMEQs5ckcMc6MeNU0RK98hyUACjfwS6jvqfazhQcr9snllDpeALekAbdeVzJlgdVeyqbXhwAGFGFj0JrMJgjbzzsuV0Lq8EVaixUGuOO7v6U2VK2jlPBF97ppzoT8c0DloB4a3uSvUq9Ck6QyZ0m6zms43hb6nqafW3vi793ROJtcn2MJIKpW3au68uE9Yafm57fvgotgOiWf6dnAhKGH75xeCMYDu76v7Po5RcqZ8brUbeu09oo5XIg5R97eqx6KxbXufRxmd4A71RhiqY3rzehNWxsHejdCisgW"
  ) {
    accessToken
    refreshToken
    tokenMeta {
      userId
      issuedAt
      expiresAt
      providerSet
    }
  }
}
```

Response:

```
{
  "data": {
    "USER_CREATE_ME": {
      "accessToken": null,
      "refreshToken": null,
      "tokenMeta": {
        "userId": "fb2af215-f422-412c-888b-886964b35d58",
        "issuedAt": "2019-04-11T13:01:55.323Z",
        "expiresAt": "2019-04-25T13:01:55.323Z",
        "providerSet": "email:password"
      }
    }
  }
}
```

## Request E-Mail proof (Could also be used for Password-Reset)

This is required to proof the email-address the user has passed. Should be done direct after registration

### 1. Get the user-identifier

Request:

```
mutation {
  getUserIdentifier(username: "franz@fullstack.build", tenant: "default")
}
```


Response:

```
{
  "data": {
    "getUserIdentifier": "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU"
  }
}
```

### 2. Request proof-email

The `info` field could contain some info that the request is for a new user. If a user wants to reset his password the same mutation is used (maybe with a different info)

Request:

```
mutation {
  initiateEmailProof(
    info: "bla"
    userIdentifier: "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU"
  )
}
```

Response:

```
{
  "data": {
    "initiateEmailProof": true
  }
}
```

### 3. Proof the AuthFactor

After the user has received the e-mail which contains the AuthFactorProofToken, the e-mail should be proofed with:

Request:

```
mutation {
  proofAuthFactor(
    authFactorProofToken: "06uDMJO4cDksSiQhE7iK8bdqH4gz0dkVIQ0X4dpwNxO5FXQjQl3MFWqPH1MNqTQk8br0Auq8XzO9A8hu7ujMYixYP8hId1B8dCahzXz5LR5dQTx3njbE99Xu4dyGW0rbfBzKVt6tVe9v665hfVDO99NQxE19FxwaeK0Q8ebaJ1NMIo2ed6nd5oXg5YPVzHcOXJTqWdSAGHXaj4mNPAFfZyVBKzd7YSyhV52F5EGz1MLG3nTewsnOs66DyARTAavfJVewfhUL9M8cNvslXciVya1jJetH0dklgQheCkF7ombk3q2AoB8oEhyIdqN3ffIG1jF90TYHRg7G7jwlG06aCWwe6Dg8DhygCKvDCH5ovz5D5cgFO9rZ9h4nTmaeD6peJYbXhHaR73cxG2irhGf3HoMhMFref14QTc63V3dZFhI68pjBsPb19Ti4B21DlvAaP"
  )
}
```

Response:

```
{
  "data": {
    "proofAuthFactor": true
  }
}
```

## Login

### 1. Get the user-identifier

Request:

```
mutation {
  getUserIdentifier(username: "franz@fullstack.build", tenant: "default")
}
```


Response:

```
{
  "data": {
    "getUserIdentifier": "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU"
  }
}
```

### 2. Create AuthFactorProofToken for Password

Request:

```
mutation {
  proofPassword(userIdentifier: "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU", 
  password: "11111111")
}
```

Response:

```
{
  "data": {
    "proofPassword": "0PbJ1NRu422I8kfn25vsjiY8niq7S53KZ6s5bhrLPzf9i2my3RmeByDrwI1RXBaQui8UutBEhDGXq6ieo6x4tR1TXLSMI4agupILcUyr6niaZT9amD6DItDiL9lx8YyNcraCQUC5G1mNiWiTnzEcV8eyjEwmb8oZDGPe2Tp6dvhw9cViYeFaEuq2f8lz6g5aKu7wZz7WSdRIlaohtgUn1ASavcncQ9EGf10jWTEIVcejZyHtfqW7k3rbJSiw4nhmQorwP33qST4a1tlccnsdSjCtbP0xenydRg9Rr57tc0qah956MzYzQW939Ma3Rj8QV1oqihr9mD690BUzjO7ppJdjWbipgRTz0cfWQouczgiy81idL00vG6K3Czvl4eNn9kK4SKbCLO6xsRAOI3pN5hmO3zcYo0IiZuifAZ54T2kgM3V2ZNgf90HLoW55v8VkbldAuFXtA3mj0mR69jHnZEi"
  }
}
```

### 3. login

Request:

```
mutation {
  login(authFactorProofTokens: ["0PbJ1NRu422I8kfn25vsjiY8niq7S53KZ6s5bhrLPzf9i2my3RmeByDrwI1RXBaQui8UutBEhDGXq6ieo6x4tR1TXLSMI4agupILcUyr6niaZT9amD6DItDiL9lx8YyNcraCQUC5G1mNiWiTnzEcV8eyjEwmb8oZDGPe2Tp6dvhw9cViYeFaEuq2f8lz6g5aKu7wZz7WSdRIlaohtgUn1ASavcncQ9EGf10jWTEIVcejZyHtfqW7k3rbJSiw4nhmQorwP33qST4a1tlccnsdSjCtbP0xenydRg9Rr57tc0qah956MzYzQW939Ma3Rj8QV1oqihr9mD690BUzjO7ppJdjWbipgRTz0cfWQouczgiy81idL00vG6K3Czvl4eNn9kK4SKbCLO6xsRAOI3pN5hmO3zcYo0IiZuifAZ54T2kgM3V2ZNgf90HLoW55v8VkbldAuFXtA3mj0mR69jHnZEi"]) {
    refreshToken
    accessToken
    tokenMeta {
      userId
      issuedAt
      expiresAt
      providerSet
    }
  }
}
```

Response:

```
{
  "data": {
    "login": {
      "refreshToken": "0gfVq9jk7kPsABod9cBk8riFOWTAC0KQ6Ofl4TNIgLzcjZF4xLa1fBqodi20wMwlfVzds7KaHTZY7KhvHlESi8UhzYiR79y258D1yEsDwq8xkgmVk",
      "accessToken": null,
      "tokenMeta": {
        "userId": "fb2af215-f422-412c-888b-886964b35d58",
        "issuedAt": "2019-04-11T13:04:08.503Z",
        "expiresAt": "2019-04-25T13:04:08.503Z",
        "providerSet": "password"
      }
    }
  }
}
```

## Refresh user-session

Request:

```
mutation {
  refreshAccessToken(refreshToken: "0i7nDJxq78Nr1T0eccces8bE0iusi6VzGrLkez1LlRCaGBsFkg9Oazar55raQVaDhYz6gmc6cKtiPN4I2i8HDcvki5YE9FgnaYzi8XqtMXfjfmlVK") {
    refreshToken
    accessToken
    tokenMeta {
      userId
      issuedAt
      expiresAt
      providerSet
    }
  }
}
```


Response:

```
{
  "data": {
    "refreshAccessToken": {
      "refreshToken": "0cbYTHfigdD9Buv3nlHEaEaPqngJV8FTFdx6amhUn4t9CK1ggzgStKA1s6ynBC2d7yy6KHKcdoYvWYeNkdAYk48h7GHSiLUncdI33zHyXX6ZDyY3X",
      "accessToken": null,
      "tokenMeta": {
        "userId": "0e405acd-1c95-44e3-bd83-f318185aad27",
        "issuedAt": "2019-04-11T12:51:26.020Z",
        "expiresAt": "2019-04-25T12:51:26.020Z",
        "providerSet": "password"
      }
    }
  }
}
```

## Logout the current session

Request:

```
mutation {
  invalidateAccessToken
}
```


Response:

```
{
  "data": {
    "invalidateAccessToken": true
  }
}
```

## Logout all sessions the user ever had

Request:

```
mutation {
  invalidateAllAccessTokens
}
```


Response:

```
{
  "data": {
    "invalidateAllAccessTokens": true
  }
}
```



## Change AuthFactor (In this example: Change password with e-mail)

This is required to proof the email-address the user has passed. Should be done direct after registration

### 1. Get the user-identifier

Request:

```
mutation {
  getUserIdentifier(username: "franz@fullstack.build", tenant: "default")
}
```


Response:

```
{
  "data": {
    "getUserIdentifier": "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU"
  }
}
```

### 2. Request proof-email

The `info` field could contain some info to format the e-mail for password-reset.

Request:

```
mutation {
  initiateEmailProof(
    info: "bla"
    userIdentifier: "04S2VyJp3bFDfzn4hSJGfG4pcdRKsdEzif6xf3h9ua1eunvpV30vB1lpv0olXFa78tvOC4yeacEdIrfDDkqYzffvOuIH1jsB3PN9qnHoFn8NVzDuj9wnr1dj83dnkH8f18ZRwQ1WwRELW3LGI8h39hjpeNc1ECzYyT9UHBwxHgUnV5TKhVSiVxPcMn047Pgv8HrEv8jkXbxhiWmkieM8YJPZHnctYHfDU"
  )
}
```

Response:

```
{
  "data": {
    "initiateEmailProof": true
  }
}
```

### 3. login with AuthFactorProofToken received by mail

Request:

```
mutation {
  login(authFactorProofTokens: ["0PbJ1NRu422I8kfn25vsjiY8niq7S53KZ6s5bhrLPzf9i2my3RmeByDrwI1RXBaQui8UutBEhDGXq6ieo6x4tR1TXLSMI4agupILcUyr6niaZT9amD6DItDiL9lx8YyNcraCQUC5G1mNiWiTnzEcV8eyjEwmb8oZDGPe2Tp6dvhw9cViYeFaEuq2f8lz6g5aKu7wZz7WSdRIlaohtgUn1ASavcncQ9EGf10jWTEIVcejZyHtfqW7k3rbJSiw4nhmQorwP33qST4a1tlccnsdSjCtbP0xenydRg9Rr57tc0qah956MzYzQW939Ma3Rj8QV1oqihr9mD690BUzjO7ppJdjWbipgRTz0cfWQouczgiy81idL00vG6K3Czvl4eNn9kK4SKbCLO6xsRAOI3pN5hmO3zcYo0IiZuifAZ54T2kgM3V2ZNgf90HLoW55v8VkbldAuFXtA3mj0mR69jHnZEi"]) {
    refreshToken
    accessToken
    tokenMeta {
      userId
      issuedAt
      expiresAt
      providerSet
    }
  }
}
```

Response:

```
{
  "data": {
    "login": {
      "refreshToken": "0gfVq9jk7kPsABod9cBk8riFOWTAC0KQ6Ofl4TNIgLzcjZF4xLa1fBqodi20wMwlfVzds7KaHTZY7KhvHlESi8UhzYiR79y258D1yEsDwq8xkgmVk",
      "accessToken": null,
      "tokenMeta": {
        "userId": "fb2af215-f422-412c-888b-886964b35d58",
        "issuedAt": "2019-04-11T13:04:08.503Z",
        "expiresAt": "2019-04-25T13:04:08.503Z",
        "providerSet": "password"
      }
    }
  }
}
```

### 4. Get UserAuthentication

We need the user-authentication to find out the AuthFactorId of the old password to delete it.

Request:
```
{
  getUserAuthentication {
    id
    userId
    isActive
    createdAt
    loginProviderSets
    modifyProviderSets
    totalLogoutTimestamp
    invalidTokenTimestamps
    authFactors {
      id
      communicationAddress
      createdAt
      provider
      proofedAt
      deletedAt
    }
  }
}

```

Response:

```
{
  "data": {
    "getUserAuthentication": {
      "id": "4d4680f5-26b0-4a81-ac87-fda397e26126",
      "userId": "fb2af215-f422-412c-888b-886964b35d58",
      "isActive": true,
      "createdAt": "2019-04-11T13:01:55.322627",
      "loginProviderSets": [
        "email",
        "password"
      ],
      "modifyProviderSets": [
        "email",
        "password"
      ],
      "totalLogoutTimestamp": "0",
      "invalidTokenTimestamps": [],
      "authFactors": [
        {
          "id": "7a2ded53-2bf0-4482-8485-67df82594ac1",
          "communicationAddress": "franz@fullstack.build",
          "createdAt": "2019-04-11T13:01:55.322627",
          "provider": "email",
          "proofedAt": null,
          "deletedAt": null
        },
        {
          "id": "82b1bc69-adca-4d96-b1d1-fbf6925ffa8a",
          "communicationAddress": null,
          "createdAt": "2019-04-11T13:01:55.322627",
          "provider": "password",
          "proofedAt": "2019-04-11T13:01:55.322627",
          "deletedAt": null
        }
      ]
    }
  }
}
```

### 5. Create AuthFactorCreationToken for a new password

Request:

```
mutation {
  createPassword(password: "11111111")
}
```

Response:

```
{
  "data": {
    "createPassword": "0xWoN04pUoYWdhmkQJHbaVsFMIgQRG0Jt6Kjh8XWeNNfnMaeeANyTNgRavw8P5rLKKASc8Sl18m1A5HMCdfypkrbrg9TWPeOgxh06LzdpYenhv9K7KUZXdjLe3yWjcOqpkU5zs4u1ReiWm2ea0DlflQvd5La53DirYy7T98pjM0LhfpjDc4ebGyap4vhOKLVGM73Tqr3R60rwbiR6lYDqRagj7vTL7fg1M5loePqa5h6iXE4dAS2xeloZm0k6H6q2dbeKOB6dyzmvcYjeNf7iOg60oVtS0OoHVOfacVXGHx7KaoVSrgrzrrXUi5cAxJQ9BkgpEQ9SRcjmZ8fEMH7E9DPCXIR4V3oO635C9rocchwemIu818BB3cO4gsKGzM4mUp67tiMxmSVzax7plJ20Kbzs70h6RVOzkhUNuexhb7MzkkPfR5bkNc2H0rJslaeLq05wdAocMvJ7JMMcpl5dSsIaUbW5ekgF79WWhh83F6REtpd9eXGkJ0E5I3Dx2ocsPi5fg0r4iX44EzUvk8F523YqixMkahWfTSni1YdBE9evJ9f8nPb3iSDAHybbOhFy8Cc9By1pi2kEDn1xbeX3cjafsR7mawhVnjNmsfzICwHh23GAbmh"
  }
}
```

### 6. Modify the UserAuthentication

Request:

```
mutation {
  modifyAuthFactors(
    authFactorProofTokens: ["0PbJ1NRu422I8kfn25vsjiY8niq7S53KZ6s5bhrLPzf9i2my3RmeByDrwI1RXBaQui8UutBEhDGXq6ieo6x4tR1TXLSMI4agupILcUyr6niaZT9amD6DItDiL9lx8YyNcraCQUC5G1mNiWiTnzEcV8eyjEwmb8oZDGPe2Tp6dvhw9cViYeFaEuq2f8lz6g5aKu7wZz7WSdRIlaohtgUn1ASavcncQ9EGf10jWTEIVcejZyHtfqW7k3rbJSiw4nhmQorwP33qST4a1tlccnsdSjCtbP0xenydRg9Rr57tc0qah956MzYzQW939Ma3Rj8QV1oqihr9mD690BUzjO7ppJdjWbipgRTz0cfWQouczgiy81idL00vG6K3Czvl4eNn9kK4SKbCLO6xsRAOI3pN5hmO3zcYo0IiZuifAZ54T2kgM3V2ZNgf90HLoW55v8VkbldAuFXtA3mj0mR69jHnZEi"],
    removeAuthFactorIds: ["82b1bc69-adca-4d96-b1d1-fbf6925ffa8a"],
    authFactorCreationTokens: ["0xWoN04pUoYWdhmkQJHbaVsFMIgQRG0Jt6Kjh8XWeNNfnMaeeANyTNgRavw8P5rLKKASc8Sl18m1A5HMCdfypkrbrg9TWPeOgxh06LzdpYenhv9K7KUZXdjLe3yWjcOqpkU5zs4u1ReiWm2ea0DlflQvd5La53DirYy7T98pjM0LhfpjDc4ebGyap4vhOKLVGM73Tqr3R60rwbiR6lYDqRagj7vTL7fg1M5loePqa5h6iXE4dAS2xeloZm0k6H6q2dbeKOB6dyzmvcYjeNf7iOg60oVtS0OoHVOfacVXGHx7KaoVSrgrzrrXUi5cAxJQ9BkgpEQ9SRcjmZ8fEMH7E9DPCXIR4V3oO635C9rocchwemIu818BB3cO4gsKGzM4mUp67tiMxmSVzax7plJ20Kbzs70h6RVOzkhUNuexhb7MzkkPfR5bkNc2H0rJslaeLq05wdAocMvJ7JMMcpl5dSsIaUbW5ekgF79WWhh83F6REtpd9eXGkJ0E5I3Dx2ocsPi5fg0r4iX44EzUvk8F523YqixMkahWfTSni1YdBE9evJ9f8nPb3iSDAHybbOhFy8Cc9By1pi2kEDn1xbeX3cjafsR7mawhVnjNmsfzICwHh23GAbmh"]
  )
}
```

Response:

```
{
  "data": {
    "modifyAuthFactors": true
  }
}
```




> If you use this API from a client which is no browser you can set the `Origin` HTTP-Header to `#?API_CLIENT`. When sending this header you'll get back the access-token direct and no cookie will be set.
