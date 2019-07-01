# Usage

## 1. Create a User

Create a user with email `franz@fullstack.build` and password `test1234`.

```graphql
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


## 3. Create File

Create a file, creates a presignedPutUrl for you.

```graphql
mutation {
  createFile(extension: "txt", type: DEFAULT) {
    extension
    type
    fileName
    uploadFileName
    presignedPutUrl
  }
}
```

Response:

```graphql
{
  "data": {
    "createFile": {
      "extension": "jpg",
      "type": "DEFAULT",
      "fileName": "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT.jpg",
      "uploadFileName": "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT-upload.jpg",
      "presignedPutUrl": "https://bettervest3-local.s3-eu-central-1.amazonaws.com/b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT-upload.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWIAEIAP76NWAD5F%2F20190701%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20190701T141902Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=9bede073514586f1514c4d7416ea0dd16c2f4fa039e32b8eb88f990c9e4aac92"
    }
  }
}
```

## 4. Upload the File

Using the presignedPutUrl you can actually upload a file to S3. For example using curl:

```shell
curl --request PUT \
     --url "https://bettervest3-local.s3-eu-central-1.amazonaws.com/b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT-upload.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWIAEIAP76NWAD5F%2F20190701%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20190701T141902Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=9bede073514586f1514c4d7416ea0dd16c2f4fa039e32b8eb88f990c9e4aac92" \
     --data "My data"
```

## 5. Verify And Occassionally Manipulate the File depending on the type and the verifier you added for that type

```graphql
mutation {
  verifyFile(fileName: "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT.jpg") {
    fileName
    objects {
      objectName
      presignedGetUrl
      info
    }
  }
}
```

## 6. ClearUpFiles

Deletes the object in S3 and the "_meta"."File" entry.

```graphql
mutation {
  clearUpFiles(fileName: "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT.jpg")
}
```