export declare class QueryBuilder {
    private resolverMeta;
    private dbMeta;
    private aggregationLimits;
    private costLimit;
    constructor(resolverMeta: any, dbMeta: any, costLimit: any);
    build(obj: any, args: any, context: any, info: any, isAuthenticated: any, match?: any): {
        sql: string;
        values: any;
        query: any;
        authRequired: any;
        potentialHighCost: boolean;
        cost: number;
    };
    private getLocalName(counter);
    private getFieldExpression(name, localName);
    private getFromExpression(gqlTypeMeta, localName, authRequired);
    private resolveTable(c, query, values, isAuthenticated, match, isAggregation);
    private resolveRelation(c, query, fieldMeta, localName, matchIdExpression, values, isAuthenticated);
    private rowToJson(c, query, values, isAuthenticated, match);
    private jsonAgg(c, query, values, isAuthenticated, match);
}
