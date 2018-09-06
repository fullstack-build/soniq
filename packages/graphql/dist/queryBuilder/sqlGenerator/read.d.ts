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
    private calculateMaxDepth(costTree);
    private getLocalName(counter);
    private getFieldExpression(name, localName);
    private getFromExpression(gqlTypeMeta, localName, authRequired);
    private resolveTable(c, query, values, isAuthenticated, match, isAggregation, costTree);
    private resolveRelation(c, query, fieldMeta, localName, matchIdExpression, values, isAuthenticated, costTree);
    private rowToJson(c, query, values, isAuthenticated, match, costTree);
    private jsonAgg(c, query, values, isAuthenticated, match, costTree);
}
