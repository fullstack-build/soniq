import { IViews, IExpressions } from './interfaces';
export declare class GraphQlParser {
    private graphQlConfig;
    private sdlSchema;
    private astSchema;
    private views;
    private expressions;
    private gQlRuntimeDocument;
    private gQlRuntimeSchema;
    private gQlTypes;
    private dbMeta;
    private mutations;
    private queries;
    private customOperations;
    private logger;
    private ENVIRONMENT;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any);
    getDbMeta(): any;
    getGqlRuntimeData(): {
        dbMeta: any;
        views: IViews;
        expressions: IExpressions;
        gQlRuntimeDocument: any;
        gQlRuntimeSchema: string;
        gQlTypes: any;
        mutations: any;
        queries: any;
        customOperations: any;
    };
    boot(): Promise<any>;
    getGraphQlSchema(): any;
    getGraphQlJsonSchema(): any;
}
