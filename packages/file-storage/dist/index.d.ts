import { LoggerFactory } from '@fullstack-one/logger';
import './migrationExtension';
export declare class FileStorage {
    private client;
    private fileStorageConfig;
    private dbGeneralPool;
    private server;
    private graphQl;
    private schemaBuilder;
    private loggerFactory;
    private logger;
    private config;
    private auth;
    private verifiers;
    constructor(loggerFactory: LoggerFactory, dbGeneralPool?: any, server?: any, bootLoader?: any, config?: any, graphQl?: any, schemaBuilder?: any, auth?: any);
    private boot();
    addVerifier(type: any, fn: any): void;
    private postMutationHook(info, context);
    private presignedPutObject(fileName);
    private presignedGetObject(fileName);
    private deleteFileAsAdmin(fileName);
    private deleteFile(fileName, context);
    private getResolvers();
}
