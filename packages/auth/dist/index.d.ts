import * as ONE from 'fullstack-one';
export declare class Auth extends ONE.AbstractPackage {
    private sodiumConfig;
    private authConfig;
    private $one;
    private dbGeneralPool;
    constructor($one?: any);
    setUser(client: any, accessToken: any): Promise<boolean>;
    loginOrRegister(username: any, tenant: any, provider: any, password: any, userIdentifier: any): Promise<any>;
    register(username: any, tenant: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
    }>;
    login(username: any, tenant: any, provider: any, password: any, userIdentifier: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
    }>;
    setPassword(accessToken: any, provider: any, password: any, userIdentifier: any): Promise<boolean>;
    forgotPassword(username: any, tenant: any): Promise<{
        userId: any;
        payload: any;
        accessToken: any;
    }>;
    removeProvider(accessToken: any, provider: any): Promise<boolean>;
    isTokenValid(accessToken: any, tempSecret?: boolean, tempTime?: boolean): Promise<boolean>;
    invalidateUserToken(accessToken: any): Promise<boolean>;
    invalidateAllUserTokens(accessToken: any): Promise<boolean>;
    linkPassport(): void;
    getPassport(): any;
}
