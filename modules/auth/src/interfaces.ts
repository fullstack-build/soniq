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
