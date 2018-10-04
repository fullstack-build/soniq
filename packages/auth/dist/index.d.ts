import { PgPoolClient } from "@fullstack-one/db";
import { LoggerFactory } from "@fullstack-one/logger";
export * from "./signHelper";
export declare class Auth {
  private sodiumConfig;
  private authConfig;
  private notificationFunction;
  private possibleTransactionIsolationLevels;
  private config;
  private dbGeneralPool;
  private loggerFactory;
  private logger;
  private server;
  private graphQl;
  private schemaBuilder;
  private parserMeta;
  constructor(dbGeneralPool: any, server: any, bootLoader: any, schemaBuilder: any, config: any, graphQl: any, loggerFactory: LoggerFactory);
  private boot;
  private addMiddleware;
  private preQueryHook;
  private preMutationCommitHook;
  private createPrivacyAgreementAcceptanceToken;
  private isPrivacyAgreementCheckActive;
  private getResolvers;
  setNotificationFunction(notificationFunction: any): void;
  setUser(dbClient: any, accessToken: any): Promise<boolean>;
  setAdmin(dbClient: any): Promise<any>;
  unsetAdmin(dbClient: any): Promise<any>;
  initializeUser(
    dbClient: any,
    userId: any
  ): Promise<{
    userId: any;
    payload: any;
    accessToken: any;
  }>;
  login(
    username: any,
    tenant: any,
    password: any,
    authToken: any,
    clientIdentifier: any
  ): Promise<{
    userId: any;
    payload: any;
    accessToken: any;
    refreshToken: any;
  }>;
  refreshUserToken(
    accessToken: any,
    refreshTokenJwt: any,
    clientIdentifier: any
  ): Promise<{
    userId: any;
    payload: any;
    accessToken: any;
    refreshToken: any;
  }>;
  createSetPasswordValues(accessToken: any, provider: any, password: any, userIdentifier: any): Promise<any[]>;
  setPasswordWithClient(accessToken: any, provider: any, password: any, userIdentifier: any, dbClient: any): Promise<void>;
  setPassword(accessToken: any, provider: any, password: any, userIdentifier: any): Promise<boolean>;
  forgotPassword(username: any, tenant: any, meta: any): Promise<boolean>;
  removeProvider(accessToken: any, provider: any): Promise<boolean>;
  getTokenMeta(
    accessToken: any,
    tempSecret?: boolean,
    tempTime?: boolean
  ): Promise<{
    isValid: boolean;
    userId: any;
    provider: any;
    timestamp: any;
    issuedAt: any;
    expiresAt: any;
  }>;
  invalidateUserToken(accessToken: any): Promise<boolean>;
  invalidateAllUserTokens(accessToken: any): Promise<boolean>;
  getPassport(): any;
  createDbClientAdminTransaction(
    dbClient: PgPoolClient,
    isolationLevel?: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED"
  ): Promise<PgPoolClient>;
  createDbClientUserTransaction(
    dbClient: PgPoolClient,
    accessToken: any,
    isolationLevel?: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED"
  ): Promise<PgPoolClient>;
  getCurrentUserIdFromClient(dbClient: any): Promise<any>;
  getCurrentUserIdFromAccessToken(accessToken: any): Promise<any>;
  adminTransaction(callback: any, isolationLevel?: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED"): Promise<any>;
  adminQuery(...queryArguments: any[]): Promise<any>;
  userTransaction(
    accessToken: any,
    callback: any,
    isolationLevel?: "SERIALIZABLE" | "REPEATABLE READ" | "READ COMMITTED" | "READ UNCOMMITTED"
  ): Promise<any>;
  userQuery(accessToken: any, ...queryArguments: any[]): Promise<any>;
  createAuthToken(
    privacyAgreementAcceptanceToken: any,
    email: any,
    providerName: any,
    profileId: any,
    tenant: any,
    profile: any
  ): {
    payload: {
      providerName: any;
      profileId: any;
      email: any;
      tenant: any;
      profile: any;
    };
    token: any;
  };
  validatePrivacyAgreementAcceptanceToken(privacyAgreementAcceptanceToken: any): void;
}
