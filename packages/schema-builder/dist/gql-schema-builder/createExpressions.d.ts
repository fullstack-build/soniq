export declare class CreateExpressions {
    private expressionsObject;
    private expressionsByName;
    private tableName;
    private total;
    constructor(expressions: any, tableName: any, total?: boolean);
    private fixExpressionType;
    private getExpression;
    getExpressionsObject(): any;
    parseExpressionInput(expressions: any, isRequiredAsPermissionExpression?: boolean): any[];
    getExpressionObject(name: any, params?: any, isRequiredAsPermissionExpression?: boolean): any;
}
export declare function orderExpressions(a: any, b: any): 0 | 1 | -1;
