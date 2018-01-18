
# Postgres auth functions

This document describes the plpgsql auth functions.

All functions are schema `_meta`.


## Terminology

| Name              | Description                                                                                                        |
|-------------------|--------------------------------------------------------------------------------------------------------------------|
| user-token        | Access-token to send to the user                                                                                   |
| user-token temp   | Temporary access-token to send to the user for certain function (returned by `forgot_password()` and `register()`) |
| admin-token       | Token required to execute most of the auth-functions                                                               |
| transaction-token | Token which gets set inside a transaction by `set_user_token()` to know the user at `current_user_id()`.           |


## Getting admin permissions

Some of the functions require admin permissions. The get them you need to set the local variable `auth.admin_token` inside a transaction where the functions gets called.

Example: Generating a admin token
```js
const ts = Date.now().toString();

const payload = `${ts}:${secrets.admin}`;

const admin_token = `${ts}:${sha256(payload)}`;
```


Example: Set admin token and call function
```
BEGIN;
set local auth.admin_token to '1515702304194:caa1145f72be9c0ddad53d32ffe2541a56123caec1b8bc1f36c4321845784a55';
SELECT _meta.get_user_pw_meta('max@mustermann.de', 'local', 'default');
```


## JSON-Objects


### Meta

This object includes all meta informations from argon2 to rehash passwords.

Example:
```js
{
  "salt": "f3fee4c48713f3f60507f0d537935a39", 
  "memlimit": 67108864, 
  "opslimit": 2, 
  "algorithm": 2, 
  "hashBytes": 128
}
```


### Token Data

Example:
```js
{
  "userId": "cd4e6cc3-47d4-4cff-bafc-f85f647ff059",
  "provider": "local",
  "timestamp": 1516027882769,
  "userToken": "$2a$04$7skXjhraz0w6tTZX5Z8pAODWgiMVgyZ6jtfw1XzwpbmHjB4sYoJPG",
  "userTokenMaxAgeInSeconds": 1209600
}
```

### Password-field content

This user logged in with facebook, but also has a normal `local` password.

Example:
```js
{
  "providers": {
    "local": {
      "hash": "$2a$06$epVWfQngxfJ87su2cg2Aqe6pZgJzWG9x/H7D23r71Kr6MDGbvT1mW",
      "meta": {
        "salt": "96272ff691e9ef1571d728174333aecc",
        "memlimit": 67108864,
        "opslimit": 2,
        "algorithm": 2,
        "hashBytes": 128
      }
    },
    "facebook": {
      "hash": "$2a$06$nTc5qjHn.6zcfEQW36k6L.HcTOxDFc9Nfa1.sm0Lc.CEyr9TcOche",
      "meta": {
        "salt": "c3bd6db853d11fd0ba5b9494c4296f00",
        "memlimit": 67108864,
        "opslimit": 2,
        "algorithm": 2,
        "hashBytes": 128
      }
    }
  },
  "invalidTokens": [1515963313579],
  "totalLogoutTimestamp": 1515963220364
}
```


## Auth table

Auth requires a table in scheme `_meta` named `Auth` with tow columns. You can create it with this command:

```sql
CREATE TABLE "_meta"."Auth" (
    "key" varchar,
    "value" varchar,
    PRIMARY KEY ("key")
);
```

This table requires the following content:


### General setup keys

| key                 | Initial value | Description                                           |
|---------------------|---------------|-------------------------------------------------------|
| auth_table          | User          | User-table name                                       |
| auth_table_schema   | public        | User-table schema                                     |
| auth_field_username | email         | Name of the username-field                            |
| auth_field_tenant   | `NULL`        | Name of the tenant-field (can be `NULL`)              |
| auth_field_password | password      | Name of the password-field (needs to be type `jsonb`) |
| auth_providers      | local         | With `:` seperated list of auth-providers.            |


### Secrets keys

| key                      | Initial value   | Description                                                                                                               |
|--------------------------|-----------------|---------------------------------------------------------------------------------------------------------------------------|
| auth_pw_secret           | 64 random chars | Secret added to hash inside pg                                                                                            |
| admin_token_secret       | 64 random chars | Secret to sign admin-access-requests                                                                                      |
| user_token_secret        | 55 random chars | Secret to sign user-tokens                                                                                                |
| user_token_temp_secret   | 55 random chars | Secret to sign temporary user-tokens                                                                                      |
| transaction_token_secret | 60 random chars | Secret to sign transaction-tokens (This gets changed to a new random string every `transaction_token_max_age_in_seconds`) |


### Max-age keys

| key                                  | Initial value | Description                                                             |
|--------------------------------------|---------------|-------------------------------------------------------------------------|
| transaction_token_max_age_in_seconds | 86400         | `transaction_token_secret` get renewed every the seconds definded here. |
| user_token_max_age_in_seconds        | 1209600       | Time-to-live of user-tokens                                             |
| user_token_temp_max_age_in_seconds   | 3600          | Time-to-live of temporary user-tokens                                   |


### Hash-meta keys

| key                         | Initial value       | Description                                                      |
|-----------------------------|---------------------|------------------------------------------------------------------|
| bf_iter_count               | 4                   | `bf_iter_count` for hashing user-tokens and temorary user-tokens |
| pw_bf_iter_count            | 6                   | `bf_iter_count` for hashing passwords.                           |
| transaction_token_timestamp | current_timestamp() | Last time the `transaction_token_secret` was renewed.            |


## Function parameters:

| Name               | Type    | Description                                                                    |
|--------------------|---------|--------------------------------------------------------------------------------|
| username           | text    | Some username (e.g. email)                                                     |
| tenant             | text    | A tenant string                                                                |
| provider           | text    | An auth provider (default is `local`)                                          |
| pwHash             | text    | A hashed password                                                              |
| userId             | text    | UUID of the user                                                               |
| userToken          | text    | userToken from token-data                                                      |
| timestamp          | bigint  | timestamp from token-data                                                      |
| useTempToken       | boolean | Set this to `true` to validate a userToken against the user_token_temp_secret  |
| useTempTokenMaxAge | boolean | Set this to `true` to validate a userToken against the user_token_temp_max_age |


## Login functions


### get_user_pw_meta(username, provider, tenant): jsonb[META]

> **Requires admin permissions**

Gets the password-metas from a user by username and tenant for a certain provider.

This only reads. There are no checks.


### login(userId, provider, pwHash) RETURNS jsonb[TOKEN DATA]

> **Requires admin permissions**

Gets token-data if `pwHash` matches the saved hash of the `provider` in the `userById` including an user-token which is required to access data and execute other permissions.


## Transaction functions

### set_user_token(userId, userToken, provider, timestamp) RETURNS void

Validates the user token and sets a transaction_token for the current transaction.


### current_user_id() RETURNS uuid

If a valid transaction_token has been set this function returns the `userId`.


## Logout functions

### invalidate_user_token(userId, userToken, provider, timestamp) RETURNS void

Invalidates the current user_token.


### invalidate_all_user_tokens(userId, userToken, provider, timestamp) RETURNS void

Invalidates all user_tokens of the current user that have ever been created.


## Management functions

### register_user(userName, tenant) RETURNS jsonb[TOKEN DATA]

Registers a new user and returns token-data including a temporary user-token to set a password.
 

### forgot_password(userName, tenant) RETURNS jsonb[TOKEN DATA]

Returns token-data including a temporary user-token to set a new password.


### set_password(userId, userToken, provider, timestamp, setProvider, psHash, pwMeta) RETURNS void

Sets the user-password (pwHash and pwMeta) of a certain provider. Creates it when it does not exist.


### remove_provider(userId, userToken, provider, timestamp, removeProvider) RETURNS void

Removes a provider from the current user. You cannot remove the provider of the token or the provider `local`. At least one provider must be left. Requires a userToken or userTokenTemp as input that isn't older than `user_token_temp_max_age_in_seconds`.


## Helper functions

### is_user_token_valid(userId, userToken, provider, timestamp, useTempToken, useTempTokenMaxAge) RETURNS boolean

Checks if a user-token is valid. When you have a tempoary user-token set `useTempToken` to `true`.
