export declare class GraphQl {
    private graphQlConfig;
    private logger;
    private ENVIRONMENT;
    private gqlParser;
    private server;
    private dbGeneralPool;
    private auth;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any, gqlParser?: any, server?: any, dbGeneralPool?: any, auth?: any);
    private boot();
}
