/* eslint-disable @typescript-eslint/naming-convention */
import { IAuthAppConfigDefaults } from "./interfaces";

export const defaultAppConfig: IAuthAppConfigDefaults = {
  secrets: {
    admin: null,
    root: null,
    cookie: null,
    encryptionKey: null,
    authProviderHashSignature: null,
  },
  sodium: {},
  authFactorProofTokenMaxAgeInSeconds: 86400, // Should be changed to one minute in production
  userIdentifierMaxAgeInSeconds: 60,
  cookie: {
    name: "access_token",
    maxAge: 1209600000, // Two weeks
    overwrite: true,
    httpOnly: true,
    signed: true,
  },
  tokenQueryParameter: "access_token",
  validOrigins: ["http://localhost:3030"],
  isServerBehindProxy: true,
  enforceHttpsOnProduction: true,
  allowAllCorsOriginsOnDev: true,
  apiClientOrigins: ["#?API_CLIENT"],
  corsOptions: {
    allowMethods: ["GET", "POST"],
    credentials: true,
    /**
     * Added maxAge because of this: https://stackoverflow.com/a/29954326/4102308
     * Chose 60 because it is default here: https://www.owasp.org/index.php/CORS_RequestPreflighScrutiny
     */
    maxAge: 60,
  },
  crypto: {
    algorithm: "aes-256-cbc",
  },
  pgConfig: {
    access_token_bf_iter_count: 4,
    access_token_max_age_in_seconds: 1209600,
    get_tenant_by_user_id_query: `SELECT 'default' "tenantId";`,
    hash_bf_iter_count: 6,
    refresh_token_bf_iter_count: 6,
    transaction_token_max_age_in_seconds: 86400,
    admin_token_max_age_in_seconds: 60,
    root_token_max_age_in_seconds: 3600,
  },
};
