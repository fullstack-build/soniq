export declare class QueryBuilder {
    private resolverMeta;
    private dbMeta;
    private costLimit;
    constructor(resolverMeta: any, dbMeta: any, costLimit: any);
    build(obj: any, args: any, context: any, info: any, isAuthenticated: any, match?: any): {
        sql: string;
        values: any;
        query: any;
        authRequired: any;
        potentialHighCost: boolean;
        costTree: {};
        cost: number;
    };
    private calculateCost(costTree);
    private getLocalName(counter);
    private getFieldExpression(name, localName);
    private getFromExpression(gqlTypeMeta, localName, authRequired);
    private resolveTable(c, query, values, isAuthenticated, match, isAggregation, costTree);
    private resolveRelation(c, query, fieldMeta, localName, matchIdExpression, values, isAuthenticated, costTree);
    private rowToJson(c, query, values, isAuthenticated, match, costTree);
    private jsonAgg(c, query, values, isAuthenticated, match, costTree);
}
