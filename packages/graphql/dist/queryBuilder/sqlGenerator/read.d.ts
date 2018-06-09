export declare function getLocalName(counter: any): string;
export declare function includesAuthView(viewNames: any, noAuthViewNames: any): any;
export declare function getJsonMerge(jsonFields: any): any;
export declare function getFieldExpression(name: any, viewNames: any, gQlType: any, localNameByType: any): any;
export declare function getViewnamesExpression(viewNames: any, gQlType: any, localNameByType: any): string;
export declare function getViewnamesSelect(viewNames: any, gQlType: any, localNameByType: any): string;
export declare function getFromExpression(viewNames: any, gQlType: any, localNameByType: any): string;
export declare function resolveTable(c: any, query: any, gQlTypes: any, dbObject: any, values: any, isAuthenticated: any, match: any): {
    sql: string;
    counter: any;
    values: any;
    authRequired: boolean;
};
export declare function resolveRelation(c: any, query: any, relation: any, gQlTypes: any, dbObject: any, values: any, matchIdExpression: any, viewNames: any, gQlType: any, localNameByType: any, isAuthenticated: any): {
    sql: string;
    counter: any;
    values: any;
    authRequired: boolean;
};
export declare function rowToJson(c: any, query: any, gQlTypes: any, dbObject: any, values: any, isAuthenticated: any, match: any): {
    sql: string;
    counter: any;
    values: any;
    authRequired: boolean;
};
export declare function jsonAgg(c: any, query: any, gQlTypes: any, dbObject: any, values: any, isAuthenticated: any, match: any): {
    sql: string;
    counter: any;
    values: any;
    authRequired: boolean;
};
export declare function getQueryResolver(gQlTypes: any, dbObject: any): (obj: any, args: any, context: any, info: any, isAuthenticated: any, match?: any) => {
    sql: string;
    values: any;
    query: any;
    authRequired: boolean;
};
