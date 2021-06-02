/* eslint-disable @typescript-eslint/naming-convention */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepRequired<T> = {
  [P in keyof T]: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export interface ISodiumConfig {
  saltBytes: number;
  hashBytes: number;
  opslimit: number;
  memlimit: number;
  algorithm: number;
}

export interface IPgConfig {
  access_token_bf_iter_count: number;
  access_token_max_age_in_seconds: number;
  get_tenant_by_user_id_query: string;
  hash_bf_iter_count: number;
  refresh_token_bf_iter_count: number;
  transaction_token_max_age_in_seconds: number;
  admin_token_max_age_in_seconds: number;
  root_token_max_age_in_seconds: number;
}

export type ISodiumConfigOptional = DeepPartial<ISodiumConfig>;

export interface IAuthAppConfig {
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
  pgConfig: IPgConfig;
}

export interface IPgConfigFinal extends DeepRequired<IPgConfig> {
  admin_token_secret: string;
  root_token_secret: string;
  auth_factor_providers: string;
}

export type IAuthAppConfigOptional = DeepPartial<IAuthAppConfig>;

export interface IAuthAppConfigInput extends IAuthAppConfigOptional {
  secrets: {
    admin: string;
    root: string;
    cookie: string;
    encryptionKey: string;
    authProviderHashSignature: string;
  };
  // pgConfig: IAuthMigConfigInput;
}

type IAuthAppConfigInputOptional = DeepPartial<IAuthAppConfigInput>;

export interface IAuthAppConfigDefaults extends Omit<IAuthAppConfigInputOptional, "secrets"> {
  secrets: {
    admin: string | null;
    root: string | null;
    cookie: string | null;
    encryptionKey: string | null;
    authProviderHashSignature: string | null;
  };
}
