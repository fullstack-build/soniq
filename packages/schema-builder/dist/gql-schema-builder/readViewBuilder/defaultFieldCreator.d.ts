export declare class CreateDefaultField {
    private expressionCreator;
    constructor(expressionCreator: any);
    create(readExpressionsField: any, gqlFieldDefinition: any, columnExpression: any, nativeFieldName: any): {
        publicFieldSql: any;
        authFieldSql: any;
        gqlFieldDefinition: any;
    };
}
