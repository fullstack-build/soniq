# Auth2 Planning

## PG-Methods

### General Admin
- is_admin(): boolean

### Register + New AuthFactor
- create_user_authentication(userId: id, isActive: boolean, loginProviderSets: string[], modifyProviderSets: string[], authFactors: {provider: string, hash: string, meta: string}[])

### Proof AuthFactor
- get_auth_factor_for_proof(userId: uuid, provider: string): {id: uuid, meta: string, createdAt: string}

### Login
- login( authFactorProofs: {id: uuid, hash: string}[], userIdentifier: string ): LoginObject

LoginObject:
```
{
  "loginToken": string;
  "issuedAt": string;
  "authFactorProviders": string[];
  "refreshToken": string;
  "maxAge": string;
  "userId": string;
}
```

authFactorIds: (devided by `:`)
```
${authFactorId_1}:${authFactorId_2}:${authFactorId_3}
```

loginTokenHash:
```
${issuedAt};${authFactorIds};${loginTokenSecret}
```

loginToken:
```
${issuedAt};${authFactorIds};${loginTokenHash}
```

### Auth-Request
- is_login_token_valid(loginToken: string): boolean
- authenticate_transaction(loginToken: string)
- current_user_id(): uuid
- current_provider_set(): string

providerSet: (devided by `:`)
```
${provider_1}:${provider_2}:${provider_3}
```

transactionTokenHash:
```
${issuedAt};${providerSet};${txid_current()};${transactionTokenSecret}
```

transactionToken:
```
${issuedAt};${providerSet};${transactionTokenHash}
```

### Refresh login session
- refresh_login_token(loginToken: string, refreshToken: string, userIdentifier: string): LoginData

### Logout
- invalidate_login_token(loginToken: string)
- invalidate_all_login_tokens(loginToken: string)

### Modify AuthFactors
- modify_auth_factors( authFactorProofs: {authFactorId: uuid, hash: string}[], removeAuthFactorIds: string[], addAuthFactors: {provider: string, hash: string, meta: string}[], loginProviderSets: string[], modifyProviderSets: string[])