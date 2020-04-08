
# Usage of the default oAuth strategy

This tutorial is assuming you have defined a User-Entity-Type called `User` in the GQL-Definition

## Register user

### 1. Generate a privacy-token

Request:

```
mutation {
  createPrivacyToken(acceptedVersion: 0) {
    privacyToken
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
      "privacyToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NlcHRlZFZlcnNpb24iOjAsImFjY2VwdGVkQXRJblVUQyI6IjIwMTgtMDYtMjJUMTM6MDg6MTUuMTQ5WiIsImlhdCI6MTUyOTY3Mjg5NSwiZXhwIjoxNTI5NzU5Mjk1fQ.EpuhlGE5Y1kvV8XwWik7c-gtV4JxrGAhZWmmnYWw5no"
      "acceptedAtInUTC": "2018-06-22T13:08:15.149Z"
      "acceptedVersion": 0
    }
  }
}
```

### 2. Request oAuth access of the user with JS


```
// Initialize Fullstack
var one = FullstackOne('http://localhost:3000')

// Define a variable with privacyToken
var privacyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NlcHRlZFZlcnNpb24iOjAsImFjY2VwdGVkQXRJblVUQyI6IjIwMTgtMDYtMjJUMTM6MDg6MTUuMTQ5WiIsImlhdCI6MTUyOTY3Mjg5NSwiZXhwIjoxNTI5NzU5Mjk1fQ.EpuhlGE5Y1kvV8XwWik7c-gtV4JxrGAhZWmmnYWw5no';

// Request access
one.oAuthLogin('facebook', privacyToken, (err, data) => {console.log(err, data);})
```

On success you'll get an auth-token inside the `data` object.

### 3. Create a new user

Use the auth-token you got to create a user.

Request:

```
mutation {
  USER_CREATE_ME(
    input: {
    	email: "bob@marley.reggea"
    	acceptedPrivacyTermsAtInUTC: "2018-06-22T13:08:15.149Z"
    	acceptedPrivacyTermsVersion: 0
  	}
  	privacyToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NlcHRlZFZlcnNpb24iOjAsImFjY2VwdGVkQXRJblVUQyI6IjIwMTgtMDYtMjJUMTM6MDg6MTUuMTQ5WiIsImlhdCI6MTUyOTY3Mjg5NSwiZXhwIjoxNTI5NzU5Mjk1fQ.EpuhlGE5Y1kvV8XwWik7c-gtV4JxrGAhZWmmnYWw5no"
  	authToken: "my-auth-token"
  )
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

## Login

To login just execute the login mutation. Use `authToken` instead of password in case of oAuth.

Request:

```
mutation {
	login(
    username: "bob@marley.reggea"
    authToken: "my-auth-token"
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