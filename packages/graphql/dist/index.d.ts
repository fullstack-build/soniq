export declare class GraphQl {
    private graphQlConfig;
    private logger;
    private ENVIRONMENT;
    private gqlParser;
    private server;
    private dbGeneralPool;
    private resolvers;
    private customQueries;
    private customMutations;
    private customFields;
    private preQueryHooks;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any, gqlParser?: any, server?: any, dbGeneralPool?: any);
    addPreQueryHook(fn: any): void;
    addResolvers(resolversObject: any): void;
    addCustomQuery(operation: any): void;
    addCustomMutation(operation: any): void;
    addCustomFields(operations: any): void;
    private boot();
}
