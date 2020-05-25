export interface IAuthFactorCreation {
  provider: string;
  communicationAddress: string | null;
  meta: string;
  hash: string;
  isProofed: boolean;
}

export interface IAuthFactorProof {
  id: string;
  hash: string;
  provider: string;
  issuedAt?: number;
  maxAgeInSeconds: number | null;
}

export interface IUserIdentifierObject {
  userAuthenticationId: string;
  authFactorId: string;
  issuedAt?: number;
}

export interface ILoginData {
  accessToken: string | null;
  refreshToken: string | null;
  tokenMeta: ITokenMeta;
}

export interface ITokenMeta {
  userId: string | null;
  providerSet: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  accessTokenMaxAgeInSeconds: number;
}

export interface ILoginResult {
  accessToken: string;
  userId: string;
  providerSet: string;
  issuedAt: number;
  refreshToken: string;
  accessTokenMaxAgeInSeconds: number;
}

export interface IValidateAccessTokenResult {
  userAuthenticationId: string;
  userId: string;
  providerSet: string;
  issuedAt: number;
  authFactorIds: string[];
  accessTokenMaxAgeInSeconds: number;
}

export interface IUserAuthentication {
  id: string;
  userId: string;
  isActive: boolean;
  loginProviderSets: string[];
  modifyProviderSets: string[];
  totalLogoutTimestamp: number;
  invalidTokenTimestamps: number[];
  createdAt: string;
  authFactors: IAuthFactor[];
}

export interface IAuthFactor {
  id: string;
  provider: string;
  communicationAddress: string | null;
  proofedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface IAuthFactorForProof {
  id: string;
  meta: string;
  communicationAddress: string | null;
  createdAt: string;
  userAuthenticationId: string;
  userId: string;
}

export interface IFindUserResponse {
  userIdentifier: string;
  isFake: boolean;
  userAuthenticationId: string;
  authFactorId: string;
}

export interface IAuthFactorForProofResponse {
  authFactor: IAuthFactorForProof;
  isFake: boolean;
}

export interface IProofResponse {
  authFactorProofToken: string;
  isFake: boolean;
}

export interface IPasswordData {
  hash: string;
  meta: IPasswordMeta;
}

export interface IPasswordMeta {
  salt: string;
  hashBytes: number;
  opslimit: number;
  memlimit: number;
  algorithm: number;
}

export interface ISodiumConfig {
  saltBytes: number;
  hashBytes: number;
  opslimit: number;
  memlimit: number;
  algorithm: number;
}

export interface ISodiumConfigOptional {
  saltBytes?: number;
  hashBytes?: number;
  opslimit?: number;
  memlimit?: number;
  algorithm?: number;
}

export interface ITransactionAuth {
  accessToken?: string | null;
  rootAccess?: boolean | null;
}

export interface IAuthApplicationConfig {
  secrets: {
    admin: string | null;
    root: string | null;
    cookie: string | null;
    encryptionKey: string | null;
    authProviderHashSignature: string | null;
  };
  sodium: ISodiumConfigOptional;
  authFactorProofTokenMaxAgeInSeconds: number;
  userIdentifierMaxAgeInSeconds: number;
  cookie: {
    name: string;
    maxAge: number;
    overwrite: boolean;
    httpOnly: boolean;
    signed: boolean;
  };
  tokenQueryParameter: string;
  validOrigins: string[];
  isServerBehindProxy: boolean;
  enforceHttpsOnProduction: boolean;
  allowAllCorsOriginsOnDev: boolean;
  apiClientOrigins: string[];
  corsOptions: {
    allowMethods: string[];
    credentials: boolean;
    maxAge: number;
  };
  crypto: {
    algorithm: string;
  };
  pgConfig: {
    access_token_bf_iter_count: number;
    access_token_max_age_in_seconds: number;
    get_tenant_by_user_id_query: string;
    hash_bf_iter_count: number;
    refresh_token_bf_iter_count: number;
    transaction_token_max_age_in_seconds: number;
    admin_token_secret: string | null;
    root_token_secret: string | null;
    admin_token_max_age_in_seconds: number;
    root_token_max_age_in_seconds: number;
    [key: string]: unknown;
  };
}

export interface IAuthApplicationConfigOverwrite {
  secrets: {
    admin: string;
    root: string;
    cookie: string;
    encryptionKey: string;
    authProviderHashSignature: string;
  };
  sodium?: ISodiumConfigOptional;
  authFactorProofTokenMaxAgeInSeconds?: number;
  userIdentifierMaxAgeInSeconds?: number;
  cookie?: {
    name?: string;
    maxAge?: number;
    overwrite?: boolean;
    httpOnly?: boolean;
    signed?: boolean;
  };
  tokenQueryParameter?: string;
  validOrigins?: string[];
  isServerBehindProxy?: boolean;
  enforceHttpsOnProduction?: boolean;
  allowAllCorsOriginsOnDev?: boolean;
  apiClientOrigins?: string[];
  corsOptions?: {
    allowMethods?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  crypto?: {
    algorithm?: string;
  };
  pgConfig?: {
    access_token_bf_iter_count?: number;
    access_token_max_age_in_seconds?: number;
    get_tenant_by_user_id_query?: string;
    hash_bf_iter_count?: number;
    refresh_token_bf_iter_count?: number;
    transaction_token_max_age_in_seconds?: number;
    admin_token_secret?: string;
    root_token_secret?: string;
    admin_token_max_age_in_seconds?: number;
    root_token_max_age_in_seconds?: number;
    [key: string]: unknown;
  };
}

export interface IAuthApplicationConfigOverwriteOptional {
  secrets?: {
    admin?: string;
    root?: string;
    cookie?: string;
    encryptionKey?: string;
    authProviderHashSignature?: string;
  };
  sodium?: ISodiumConfigOptional;
  authFactorProofTokenMaxAgeInSeconds?: number;
  userIdentifierMaxAgeInSeconds?: number;
  cookie?: {
    name?: string;
    maxAge?: number;
    overwrite?: boolean;
    httpOnly?: boolean;
    signed?: boolean;
  };
  tokenQueryParameter?: string;
  validOrigins?: string[];
  isServerBehindProxy?: boolean;
  enforceHttpsOnProduction?: boolean;
  allowAllCorsOriginsOnDev?: boolean;
  apiClientOrigins?: string[];
  corsOptions?: {
    allowMethods?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  crypto?: {
    algorithm?: string;
  };
  pgConfig?: {
    access_token_bf_iter_count?: number;
    access_token_max_age_in_seconds?: number;
    get_tenant_by_user_id_query?: string;
    hash_bf_iter_count?: number;
    refresh_token_bf_iter_count?: number;
    transaction_token_max_age_in_seconds?: number;
    admin_token_secret?: string;
    root_token_secret?: string;
    admin_token_max_age_in_seconds?: number;
    root_token_max_age_in_seconds?: number;
    [key: string]: unknown;
  };
}

export interface IAuthRuntimeConfig {
  secrets: {
    admin: string;
    root: string;
    cookie: string;
    encryptionKey: string;
    authProviderHashSignature: string;
  };
  sodium: ISodiumConfigOptional;
  authFactorProofTokenMaxAgeInSeconds: number;
  userIdentifierMaxAgeInSeconds: number;
  cookie: {
    name: string;
    maxAge: number;
    overwrite: boolean;
    httpOnly: boolean;
    signed: boolean;
  };
  tokenQueryParameter: string;
  validOrigins: string[];
  isServerBehindProxy: boolean;
  enforceHttpsOnProduction: boolean;
  allowAllCorsOriginsOnDev: boolean;
  apiClientOrigins: string[];
  corsOptions: {
    allowMethods: string[];
    credentials: boolean;
    maxAge: number;
  };
  crypto: {
    algorithm: string;
  };
  pgConfig?: {
    access_token_bf_iter_count?: number;
    access_token_max_age_in_seconds?: number;
    get_tenant_by_user_id_query?: string;
    hash_bf_iter_count?: number;
    refresh_token_bf_iter_count?: number;
    transaction_token_max_age_in_seconds?: number;
    admin_token_secret?: string;
    root_token_secret?: string;
    admin_token_max_age_in_seconds?: number;
    root_token_max_age_in_seconds?: number;
    [key: string]: unknown;
  };
}

export interface IGetAuthModuleRuntimeConfigResult {
  runtimeConfig: IAuthRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetAuthModuleRuntimeConfig = (updateKey?: string) => Promise<IGetAuthModuleRuntimeConfigResult>;

export interface IAuthFactorMeta {
  sodiumMeta: IPasswordMeta;
  providerMeta: unknown;
  isOldPassword?: true;
}

export interface IPgSettings {
  [key: string]: string;
}
