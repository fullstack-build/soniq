export declare function parseReadField(ctx: any): {
    gqlFieldName: any;
    nativeFieldName: any;
    publicFieldSql: any;
    authFieldSql: any;
    gqlFieldDefinition: any;
    meta: {
        foreignGqlTypeName: any;
        isListType: boolean;
        isNonNullType: boolean;
        relationName: any;
        table: {
            gqlTypeName: any;
            schemaName: any;
            tableName: any;
        };
    };
}[];
export declare function parseUpdateField(ctx: any): {
    kind: string;
    name: {
        kind: string;
        value: any;
    };
    arguments: any[];
    type: {
        kind: string;
        type: {
            kind: string;
            type: {
                kind: string;
                name: {
                    kind: string;
                    value: string;
                };
            };
        };
    };
    directives: any[];
}[] | {
    kind: string;
    name: {
        kind: string;
        value: any;
    };
    arguments: any[];
    type: {
        kind: string;
        name: {
            kind: string;
            value: string;
        };
    };
    directives: any[];
}[];
export declare function parseCreateField(ctx: any): {
    kind: string;
    name: {
        kind: string;
        value: any;
    };
    arguments: any[];
    type: {
        kind: string;
        type: {
            kind: string;
            type: {
                kind: string;
                name: {
                    kind: string;
                    value: string;
                };
            };
        };
    };
    directives: any[];
}[] | {
    kind: string;
    name: {
        kind: string;
        value: any;
    };
    arguments: any[];
    type: {
        kind: string;
        name: {
            kind: string;
            value: string;
        };
    };
    directives: any[];
}[];
