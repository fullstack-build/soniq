import * as apolloServer from "apollo-server-koa";
export { apolloServer };
export declare class GraphQl {
    private graphQlConfig;
    private apolloSchema;
    private apolloClient;
    private config;
    private loggerFactory;
    private logger;
    private ENVIRONMENT;
    private schemaBuilder;
    private server;
    private dbGeneralPool;
    private resolvers;
    private operations;
    private hooks;
    constructor(loggerFactory: any, config: any, bootLoader: any, schemaBuilder: any, server: any, dbGeneralPool: any);
    private boot;
    addPreQueryHook(fn: any): void;
    addHook(name: any, fn: any): void;
    addResolvers(resolversObject: any): void;
    prepareSchema(gqlRuntimeDocument: any, dbMeta: any, resolverMeta: any): any;
    getApolloClient(accessToken?: string, ctx?: any): any;
}
