import * as ONE from 'fullstack-one';
export declare class GraphQl extends ONE.AbstractPackage {
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
    private $one;
    private logger;
    private ENVIRONMENT;
    constructor(loggerFactory?: any);
    boot(): Promise<any>;
    getGraphQlSchema(): any;
    getGraphQlJsonSchema(): any;
    addEndpoints(): Promise<void>;
}
