import { LoggerFactory } from '@fullstack-one/logger';
export * from './signHelper';
export declare class Auth {
    private readonly sodiumConfig;
    private authConfig;
    private notificationFunction;
    private dbGeneralPool;
    private logger;
    private server;
    private graphQl;
    private schemaBuilder;
    private parserMeta;
    constructor(dbGeneralPool?: any, server?: any, bootLoader?: any, schemaBuilder?: any, config?: any, graphQl?: any, loggerFactory?: LoggerFactory);
    setNotificationFunction(notificationFunction: any): void;
    setUser(client: any, accessToken: any): Promise<boolean>;
    setAdmin(client: any): Promise<any>;
    unsetAdmin(client: any): Promise<any>;
    initializeUser(client: any, userId: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
    }>;
    login(username: any, tenant: any, password: any, authToken: any, clientIdentifier: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
        refreshToken: any;
    }>;
    refreshUserToken(accessToken: any, refreshTokenJwt: any, clientIdentifier: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
        refreshToken: any;
    }>;
    createSetPasswordValues(accessToken: any, provider: any, password: any, userIdentifier: any): Promise<any[]>;
    setPasswordWithClient(accessToken: any, provider: any, password: any, userIdentifier: any, client: any): Promise<void>;
    setPassword(accessToken: any, provider: any, password: any, userIdentifier: any): Promise<boolean>;
    forgotPassword(username: any, tenant: any, meta: any): Promise<boolean>;
    removeProvider(accessToken: any, provider: any): Promise<boolean>;
    getTokenMeta(accessToken: any, tempSecret?: boolean, tempTime?: boolean): Promise<{
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
    createDbClientAdminTransaction(dbClient: any): Promise<any>;
    createDbClientUserTransaction(dbClient: any, accessToken: any): Promise<any>;
    getCurrentUserIdFromClient(dbClient: any): Promise<any>;
    getCurrentUserIdFromAccessToken(accessToken: any): Promise<any>;
    adminTransaction(callback: any): Promise<any>;
    adminQuery(...queryArguments: any[]): Promise<any>;
    userTransaction(accessToken: any, callback: any): Promise<any>;
    userQuery(accessToken: any, ...queryArguments: any[]): Promise<any>;
    private addMiddleware();
    private boot();
    private preQueryHook(client, context, authRequired);
    private preMutationCommitHook(client, hookInfo);
    private createPrivacyToken(acceptedVersion);
    private isPrivacyPolicyCheckActive();
    private getResolvers();
}
