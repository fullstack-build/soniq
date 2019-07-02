# Usage

## Outline

[Preparation: Create a User and Login](#preparation-user-entity-create-a-user-and-login)<br>
[1 Create File](#1-create-file)<br>
[2 File Verification / Manipulation](#2-file-verification--manipulation)<br>
[3 Add File to an Entity](#3-add-file-to-an-entity)<br>
[4 Read File](#4-read-file)<br>
[5 Delete File in Postgres and S3](#5-delete-file-in-postgres-and-s3)

## Preparation: User Entity, Create a User and Login

### User Entity

```ts
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { files } from "@fullstack-one/file-storage";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";

@Entity({ schema: "public" })
@MutationPermissions({
  createViews: {
    me: {
      fields: ["name", "images"],
      expressions: "Anyone",
      returnOnlyId: true
    }
  },
  updateViews: {
    me: {
      fields: ["id", "images"],
      expressions: { name: "Owner", params: { field: "id" } },
      returnOnlyId: true
    }
  }
})
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  public name: string;

  @Column()
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  @files(["DEFAULT", "PROFILE_IMAGE"])
  images?: string[]
}
```

### Create User

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

### Login

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


## 1 Create File

### Create a PresignedPutUrl and Store a "_meta"."File" entry

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

```json
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

### Upload Data to PresignedPutUrl

Using the presignedPutUrl you can actually upload a file to S3. For example using curl:

```shell
curl --request PUT \
     --url "https://bettervest3-local.s3-eu-central-1.amazonaws.com/b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT-upload.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWIAEIAP76NWAD5F%2F20190701%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20190701T141902Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=9bede073514586f1514c4d7416ea0dd16c2f4fa039e32b8eb88f990c9e4aac92" \
     --data "My data"
```

## 2 File Verification / Manipulation

Downloads the file from S3, verifies it, occassionally manipulates it and uploads it back again making it available for signedGetUrls.

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

## 3 Add File to an Entity

Hint: You need to run the verification / manipulation mutation first before you can add a file to another entity.

```graphql
mutation {
  USER_UPDATE_ME(input: {
    id: "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT.jpg"
    images: ["8c95267f-1424-45cf-ad52-57e46b7ae9b5-DEFAULT.txt"]
  })
}
```

## 4 Read File

Hint: You need to run the verification / manipulation mutation first before the file gets visible. 

### Get presignedGetUrl

```graphql
{
  users {
    id
    name
    images {
      fileName
      objects {
        objectName
        presignedGetUrl
        info
      }
    }
  }
}
```

Response:

```json
{
  "data": {
    "users": [
      {
        "id": "b6cbfe21-047d-4ba3-a8e6-5f124ac8e13c",
        "name": "Karl Napf",
        "images": [
          {
            "fileName": "deca0c3c-03c9-4ba1-b3d4-b7a83cc1717e-DEFAULT.txt",
            "objects": [
              {
                "objectName": "deca0c3c-03c9-4ba1-b3d4-b7a83cc1717e-DEFAULT.txt",
                "presignedGetUrl": "https://bettervest3-local.s3-eu-central-1.amazonaws.com/deca0c3c-03c9-4ba1-b3d4-b7a83cc1717e-DEFAULT.txt?response-cache-control=private%2C%20max-age%3D43200&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWIAEIAP76NWAD5F%2F20190702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20190702T080000Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=e38672323c697d864097292af4e84d861e8c57f737c5ae3402322ed0f779e1dd",
                "info": "default"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Load File from S3 using presignedGetUrl

For example using curl:

```shell
curl --request GET \
     --url "https://bettervest3-local.s3-eu-central-1.amazonaws.com/deca0c3c-03c9-4ba1-b3d4-b7a83cc1717e-DEFAULT.txt?response-cache-control=private%2C%20max-age%3D43200&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWIAEIAP76NWAD5F%2F20190702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20190702T080000Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=e38672323c697d864097292af4e84d861e8c57f737c5ae3402322ed0f779e1dd"
```


## 5 Delete File in Postgres and S3

Deletes the object in S3 and the "_meta"."File" entry.

```graphql
mutation {
  clearUpFiles(fileName: "b71e8ce1-8ac2-4567-b19e-b49c6ccd66ff-DEFAULT.jpg")
}
```