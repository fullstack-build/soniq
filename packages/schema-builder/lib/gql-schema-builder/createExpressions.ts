export class CreateExpressions {
  private compiledExpressions: ICompiledExpressions = {};
  private expressionsByName: IExpressionsByName = {};
  private tableName: string;
  private total: boolean = false;

  constructor(expressions: IExpression[], tableName: string, total: boolean = false) {
    Object.values(expressions).forEach((expression: IExpression) => {
      if (this.expressionsByName[expression.name] != null) {
        throw new Error(`Expression '${expression.name}' is defined at least twice.`);
      }
      this.expressionsByName[expression.name] = expression;
    });

    this.tableName = tableName;
    this.total = total;
  }

  // Allow String/Array/Object as input and transfer it to an array of objects
  private fixExpressionType(expressionInput: IExpressionInput): IExpressionInputObject[] {
    const expressions: IExpressionInputObject[] = [];

    if (Array.isArray(expressionInput) === true) {
      const expressionInputArray = expressionInput as (string | IExpressionInputObject)[];
      expressionInputArray.forEach((innerExpression) => {
        this.fixExpressionType(innerExpression).forEach((e) => expressions.push(e));
      });
    } else if (typeof expressionInput === "string") {
      expressions.push({ name: expressionInput as string });
    } else if (typeof expressionInput === "object") {
      const expressionInputObject = expressionInput as IExpressionInputObject;
      if (expressionInputObject.name != null) {
        expressions.push(expressionInputObject);
      }
    }

    return expressions;
  }

  private getExpression(name: string, params: IExpressionParams, isRequiredAsPermissionExpression: boolean = false) {
    if (this.expressionsByName[name] == null) {
      throw new Error(`Expression '${name}' is not defined.`);
    }

    const expression = this.expressionsByName[name];

    if (isRequiredAsPermissionExpression && expression.gqlReturnType !== "Boolean") {
      throw new Error(
        `You are using an the not Boolean expression '${name}' for a permission. This is not possible. A expression defining a permission must return true/false.`
      );
    }

    let expressionName = name;

    if (params != null && typeof params === "object" && Object.keys(params).length > 0) {
      if (expression.getNameWithParams == null) {
        throw new Error(`You are using expression '${name}' with params. However, this expression has not defined 'getNameWithParams(params)'.`);
      }
      expressionName = expression.getNameWithParams(params);
    }

    expressionName = `_${expressionName}`;

    if (this.compiledExpressions[expressionName] == null) {
      const expressionContext = {
        getField: (fieldName: string): string => {
          this.compiledExpressions[expressionName].requiresLateral = true;
          return `"${this.tableName}"."${fieldName}"`;
        },
        getExpression: (tempName: string, tempParams: IExpressionParams): string => {
          const tempExpressionName = this.getExpression(tempName, tempParams);
          this.compiledExpressions[expressionName].requiresLateral = true;
          this.compiledExpressions[expressionName].order = this.compiledExpressions[tempExpressionName].order + 1;
          if (this.compiledExpressions[tempExpressionName].requiresAuth === true) {
            this.compiledExpressions[expressionName].requiresAuth = true;
          }
          if (this.compiledExpressions[expressionName].dependentExpressions.indexOf(tempExpressionName) < 0) {
            this.compiledExpressions[expressionName].dependentExpressions.push(tempExpressionName);
          }
          if (this.total === true) {
            //  TODO: Consider renaming total to a clearer name
            // For Create, Update and Delete Views, we don't create FROM clauses for every expression. Instead each expression sql gets returned without that placeholder
            return `(${this.compiledExpressions[tempExpressionName].sql})`;
          } else {
            return `"${tempExpressionName}"."${tempExpressionName}"`;
          }
        }
      };

      this.compiledExpressions[expressionName] = {
        type: expression.type,
        gqlReturnType: expression.gqlReturnType,
        name: expressionName,
        sql: expression.generate(expressionContext, params),
        requiresLateral: false,
        requiresAuth: expression.requiresAuth === true,
        dependentExpressions: [],
        order: 0,
        isRequiredAsPermissionExpression,
        excludeFromPermissionExpressions: expression.excludeFromPermissionExpressions === true
      };

      if (this.compiledExpressions[expressionName].sql.toLowerCase() === "true" && this.compiledExpressions[expressionName].requiresAuth === true) {
        throw new Error(`A expression which requires auth cannot return 'TRUE' as SQL. Found in '${name}'.`);
      }
    }
    if (isRequiredAsPermissionExpression === true) {
      this.compiledExpressions[expressionName].isRequiredAsPermissionExpression = true;
    }

    return expressionName;
  }

  public getCompiledExpressions(): ICompiledExpressions {
    return this.compiledExpressions;
  }

  public parseExpressionInput(expressionsInput: IExpressionInput, isRequiredAsPermissionExpression: boolean = false): ICompiledExpression[] {
    return this.fixExpressionType(expressionsInput).map((expression: IExpressionInputObject) => {
      return this.getCompiledExpression(expression.name, expression.params || {}, isRequiredAsPermissionExpression);
    });
  }

  public getCompiledExpression(name, params?, isRequiredAsPermissionExpression = false): ICompiledExpression {
    const expressionName = this.getExpression(name, params, isRequiredAsPermissionExpression);
    return this.compiledExpressions[expressionName];
  }
}

export function orderExpressions(a: ICompiledExpression, b: ICompiledExpression) {
  if (a.order > b.order) {
    return 1;
  }
  if (a.order < b.order) {
    return -1;
  }
  return 0;
}

export interface IExpressionsByName {
  [name: string]: IExpression;
}

export interface IExpression {
  name: string;
  type: "expression" | "function";
  requiresAuth?: boolean;
  gqlReturnType: string;
  getNameWithParams?: (params: IExpressionParams) => string;
  generate: (context: IExpressionContext, params: IExpressionParams) => string;
  excludeFromPermissionExpressions?: boolean;
}

export interface IExpressionContext {
  getField: (name: string) => string;
  getExpression: (name: string, params: IExpressionParams) => string;
}

export interface ICompiledExpressions {
  [name: string]: ICompiledExpression;
}

export interface ICompiledExpression {
  type: string;
  gqlReturnType: string;
  name: string;
  sql: string;
  requiresLateral: boolean;
  requiresAuth: boolean;
  dependentExpressions: string[];
  order: number;
  isRequiredAsPermissionExpression: boolean;
  excludeFromPermissionExpressions: boolean;
}

export interface IExpressionInputObject {
  name: string;
  params?: IExpressionParams;
}

export interface IExpressionParams {
  [key: string]: any;
}

export type IExpressionInput = IExpressionInputObject | string | (IExpressionInputObject | string)[];