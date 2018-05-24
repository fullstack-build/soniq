import { LoggerFactory } from '@fullstack-one/logger';
export declare class FileStorage {
    private client;
    private fileStorageConfig;
    private dbGeneralPool;
    private server;
    private graphQl;
    private schemaBuilder;
    private logger;
    private config;
    private auth;
    private verifiers;
    constructor(loggerFactory: LoggerFactory, dbGeneralPool?: any, server?: any, bootLoader?: any, config?: any, graphQl?: any, schemaBuilder?: any, auth?: any);
    addVerifier(type: any, fn: any): void;
    private boot();
    private postMutationHook(info, context);
    private presignedPutObject(fileName);
    private presignedGetObject(fileName);
    private deleteFileAsAdmin(fileName);
    private deleteFile(fileName, context);
    private getResolvers();
}
