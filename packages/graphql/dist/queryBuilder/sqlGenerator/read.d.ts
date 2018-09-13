export declare class QueryBuilder {
    private resolverMeta;
    private dbMeta;
    private costLimit;
    private minQueryDepthToCheckCostLimit;
    constructor(resolverMeta: any, dbMeta: any, costLimit: any, minQueryDepthToCheckCostLimit: any);
    build(obj: any, args: any, context: any, info: any, isAuthenticated: any, match?: any): {
        sql: string;
        values: any;
        query: any;
        authRequired: any;
        potentialHighCost: boolean;
        costTree: {};
        maxDepth: number;
    };
    private calculateMaxDepth;
    private getLocalName;
    private getFieldExpression;
    private getFromExpression;
    private resolveTable;
    private resolveRelation;
    private rowToJson;
    private jsonAgg;
}
