export declare class GraphQl {
    private graphQlConfig;
    private logger;
    private ENVIRONMENT;
    private schemaBuilder;
    private server;
    private dbGeneralPool;
    private resolvers;
    private customQueries;
    private customMutations;
    private customFields;
    private hooks;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any, schemaBuilder?: any, server?: any, dbGeneralPool?: any);
    addPreQueryHook(fn: any): void;
    addHook(name: any, fn: any): void;
    addResolvers(resolversObject: any): void;
    addCustomQuery(operation: any): void;
    addCustomMutation(operation: any): void;
    addCustomFields(operations: any): void;
    private boot();
}
