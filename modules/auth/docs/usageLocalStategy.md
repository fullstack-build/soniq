
# Usage of the default local strategy

This tutorial is assuming you have defined a User-Entity-Type called `User` in the GQL-Definition and a permissions object with  `gqlTypeName: "User"`.

## Register user

### 1. Generate a privacy-token

Request:

```
mutation {
  createPrivacyAgreementAcceptanceToken(acceptedVersion: 0) {
    token
    acceptedAtInUTC
    acceptedVersion
  }
}
```


Response:

```
{
  "data": {
    "createPrivacyToken": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NlcHRlZFZlcnNpb24iOjAsImFjY2VwdGVkQXRJblVUQyI6IjIwMTgtMDYtMjJUMTM6MDg6MTUuMTQ5WiIsImlhdCI6MTUyOTY3Mjg5NSwiZXhwIjoxNTI5NzU5Mjk1fQ.EpuhlGE5Y1kvV8XwWik7c-gtV4JxrGAhZWmmnYWw5no"
      "acceptedAtInUTC": "2018-06-22T13:08:15.149Z"
      "acceptedVersion": 0
    }
  }
}
```

### 2. Create a new user

Request:

```
mutation {
  USER_CREATE_ME(input: {
    email: "bob@marley.reggea"
    privacyAgreementAcceptedAtInUTC: "2018-06-22T13:08:15.149Z"
    privacyAgreementAcceptedVersion: 0
  }, privacyToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NlcHRlZFZlcnNpb24iOjAsImFjY2VwdGVkQXRJblVUQyI6IjIwMTgtMDYtMjJUMTM6MDg6MTUuMTQ5WiIsImlhdCI6MTUyOTY3Mjg5NSwiZXhwIjoxNTI5NzU5Mjk1fQ.EpuhlGE5Y1kvV8XwWik7c-gtV4JxrGAhZWmmnYWw5no")
}
```

Response:

```
{
  "data": {
    "USER_CREATE_ME": "5ad694a6-1ca9-4711-b1c7-cf52de86ef62"
  }
}
```

### 3. Set a password

After creating a user or requesting a password-reset you will receive an access-token by the notification-service you defined. Use it to set a new password.

Request:

```
mutation {
	setPassword(
    password: "test"
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YWQ2OTRhNi0xY2E5LTQ3MTEtYjFjNy1jZjUyZGU4NmVmNjIiLCJwcm92aWRlciI6ImxvY2FsIiwidXNlcm5hbWUiOiJkdXN0aW4yQGZ1bGxzdGFjay5idWlsZCIsInRpbWVzdGFtcCI6MTUyOTY3MzA1MDYwOSwidXNlclRva2VuIjoiJDJhJDA0JHp4ZWp5cUpmNDlUSWZwOGxsMC9adWV3TWpkbWZrSDMzRDMxZmluSC5nb1BNVThocTEwM1QyIiwidXNlclRva2VuTWF4QWdlSW5TZWNvbmRzIjozNjAwLCJpYXQiOjE1Mjk2NzMwNTAsImV4cCI6MTUyOTY3NjY1MH0.z9Dv69IdiEvBUPITHYFYLk0Jz7rFTJnnK7z9kIkfDls"
  )  
}
```

Response:

```
{
  "data": {
    "setPassword": true
  }
}
```

## Forgot password / Resend registration mail

### 1. Request a passoword reset

This will trigger the notification-service to send a new mail.
By providing some information in `meta` field you can pass some information to your notification service to send different mails depending on the source-action. For example you may want to send a different mail when a user clicked "Forgot password" and "Resend registration e-mail".

Request:

```
mutation {
	forgotPassword(
    username: "bob@marley.reggea"
    meta: "resend-register-mail"
  )
}
```

Response:

```
{
  "data": {
    "forgotPassword": true
  }
}
```

### 2. Set a new password

Through the notification service you will receive a access-token to set the password as shown in [Register User - 3. Set a password](#Register%20user)

## Login

To login just execute the login mutation.

Request:

```
mutation {
	login(
    username: "bob@marley.reggea"
    password: "test"
  ) {
    userId
    accessToken
    refreshToken
    sessionExpirationTimestamp
  }
}
```

Response: 

```
{
  "data": {
    "login": {
      "userId": "5ad694a6-1ca9-4711-b1c7-cf52de86ef62",
      "accessToken": null,
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IiQyYSQwNCRzS2lOeFFiZm5NRjFCOC5KREcycnBldjUwVTdVTkpQSVFvNWw1UU4zbXFwa2ppVkpWbGplTyIsImlhdCI6MTUyOTY3NDY3NywiZXhwIjoxNTMwODg0Mjc3fQ.WozKP81DpgJAR9C1JygHw-pPqWx9HlV89QhE73-8QGQ",
      "sessionExpirationTimestamp": "1530884277441"
    }
  }
}
```

> If you use this API from a client which is no browser you can set the `Origin` HTTP-Header to `#?API_CLIENT`. When sending this header you'll get back the access-token direct and no cookie will be set.
