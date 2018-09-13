import { LoggerFactory } from '@fullstack-one/logger';
import * as Minio from 'minio';
import { Verifier, IBucketObject } from './Verifier';
import { DefaultVerifier } from './DefaultVerifier';
export { DefaultVerifier, Verifier, Minio, IBucketObject };
import './migrationExtension';
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
    private verifierObjects;
    constructor(loggerFactory: LoggerFactory, dbGeneralPool?: any, server?: any, bootLoader?: any, config?: any, graphQl?: any, schemaBuilder?: any, auth?: any);
    addVerifier(type: any, fn: any): void;
    private boot();
    private postMutationHook(info, context);
    private presignedPutObject(objectName);
    private presignedGetObject(objectName);
    private deleteFileAsAdmin(fileName);
    private deleteFile(fileName, context);
    private deleteObjects(filePrefix);
    private getResolvers();
}
