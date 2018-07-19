import { LoggerFactory } from '@fullstack-one/logger';
export declare class AuthFbToken {
    private authFbTokenConfig;
    private logger;
    private auth;
    private config;
    private fbHelper;
    constructor(auth: any, bootLoader: any, schemaBuilder: any, config: any, graphQl: any, loggerFactory: LoggerFactory);
    private boot;
    private getResolvers;
}
