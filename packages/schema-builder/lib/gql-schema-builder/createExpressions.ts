export class CreateExpressions {
  private expressionsObject: any = {};
  private expressionsByName: any = {};
  private tableName: string;
  private total: any = false;

  constructor(expressions, tableName, total = false) {
    Object.values(expressions).forEach((expression: any) => {
      if (this.expressionsByName[expression.name] != null) {
        throw new Error(`Expression '${expression.name}' is defined at least twice.`);
      }
      this.expressionsByName[expression.name] = expression;
    });

    this.tableName = tableName;
    this.total = total;
  }

  // Allow String/Array/Object as input and transfer it to an array of objects
  private fixExpressionType(expression) {
    const expressions = [];

    if (Array.isArray(expression) === true) {
      expression.forEach((innerExpression) => {
        this.fixExpressionType(innerExpression).forEach((e) => expressions.push(e));
      });
    } else if (typeof expression === "string") {
      expressions.push({ name: expression });
    } else if (typeof expression === "object" && expression.name != null) {
      expressions.push(expression);
    }

    return expressions;
  }

  private getExpression(name, params?, isRoot = false) {
    if (this.expressionsByName[name] == null) {
      throw new Error(`Expression '${name}' is not defined.`);
    }

    const expression = this.expressionsByName[name];

    let expressionName = name;

    if (params != null && typeof params === "object" && Object.keys(params).length > 0) {
      if (expression.getNameWithParams == null) {
        throw new Error(`You are using expression '${name}' with params. However, this expression has not defined 'getNameWithParams(params)'.`);
      }
      expressionName = expression.getNameWithParams(params);
    }

    expressionName = `_${expressionName}`;

    if (this.expressionsObject[expressionName] == null) {
      const expressionContext = {
        getField: (fieldName) => {
          this.expressionsObject[expressionName].requiresLateral = true;
          return `"${this.tableName}"."${fieldName}"`;
        },
        getExpression: (tempName, tempParams) => {
          const tempExpressionName = this.getExpression(tempName, tempParams);
          this.expressionsObject[expressionName].requiresLateral = true;
          this.expressionsObject[expressionName].order = this.expressionsObject[tempExpressionName].order + 1;
          if (this.expressionsObject[tempExpressionName].requiresAuth === true) {
            this.expressionsObject[expressionName].requiresAuth = true;
          }
          if (this.expressionsObject[expressionName].dependentExpresssions.indexOf(tempExpressionName) < 0) {
            this.expressionsObject[expressionName].dependentExpresssions.push(tempExpressionName);
          }
          if (this.total === true) {
            //  TODO: Consider renaming total to a clearer name
            return `(${this.expressionsObject[tempExpressionName].sql})`;
          } else {
            return `"${tempExpressionName}"."${tempExpressionName}"`;
          }
        }
      };

      this.expressionsObject[expressionName] = {
        type: expression.type,
        gqlReturnType: expression.gqlReturnType,
        name: expressionName,
        sql: null,
        requiresLateral: false,
        requiresAuth: expression.requiresAuth === true,
        dependentExpresssions: [], // TODO: Dustin: remove third S from Expresssions
        order: 0,
        isRoot
      };

      this.expressionsObject[expressionName].sql = expression.generate(expressionContext, params);

      if (this.expressionsObject[expressionName].sql.toLowerCase() === "true" && this.expressionsObject[expressionName].requiresAuth === true) {
        throw new Error(`A expression which requires auth cannot return 'TRUE' as SQL. Found in '${name}'.`);
      }
    }

    return expressionName;
  }

  public getExpressionsObject() {
    return this.expressionsObject;
  }

  public parseExpressionInput(expressions) {
    return this.fixExpressionType(expressions).map((expression) => {
      return this.getExpressionObject(expression.name, expression.params || {}, true);
    });
  }

  public getExpressionObject(name, params?, isRoot?) {
    const expressionName = this.getExpression(name, params, isRoot);
    return this.expressionsObject[expressionName];
  }
}

export function orderExpressions(a, b) {
  if (a.order > b.order) {
    return 1;
  }
  if (a.order < b.order) {
    return -1;
  }
  return 0;
}
