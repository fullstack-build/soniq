export declare class GraphQl {
    private graphQlConfig;
    private logger;
    private ENVIRONMENT;
    private schemaBuilder;
    private server;
    private dbGeneralPool;
    private resolvers;
    private operations;
    private hooks;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any, schemaBuilder?: any, server?: any, dbGeneralPool?: any);
    addPreQueryHook(fn: any): void;
    addHook(name: any, fn: any): void;
    addResolvers(resolversObject: any): void;
    prepareSchema(gqlRuntimeDocument: any, dbMeta: any, resolverMeta: any): any;
    private boot();
}
