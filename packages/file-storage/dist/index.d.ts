export declare class FileStorage {
    private client;
    private fileStorageConfig;
    private dbGeneralPool;
    private server;
    private graphQl;
    private graphQlParser;
    constructor(dbGeneralPool?: any, server?: any, bootLoader?: any, migration?: any, config?: any, graphQl?: any, graphQlParser?: any);
    private boot();
    private getResolvers();
}
