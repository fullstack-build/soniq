import { Column } from "./column";
import { IDbVariable, IDbExpressionVariable, IDbColumnNameVariable, IDbColumnIdVariable, IDbExpression } from "../migration/DbSchemaInterface";

import { v5 as uuidv5 } from "uuid";
import { Schema } from "./schema";

export interface IExpression {
  gqlReturnType: string;
  authRequired?: boolean;
  excludeFromWhereClause?: boolean;
  name?: string;
  generateSql: (getExpression: (expression: Expression) => string, getColumn: (column: string | Column) => string) => string;
}

export class Expression {
  private definition: IExpression;

  constructor(definition: IExpression) {
    this.definition = definition;
  }

  public _build(schema: Schema): IDbExpression {
    const variables: IDbVariable[] = [];

    const addVariable = (variable: IDbVariable): string => {
      const key = `v${variables.length}`;

      variables.push({
        ...variable,
        key
      });

      return `\${${key}}`;
    };

    const sqlTemplate = this.definition.generateSql(
      // tslint:disable-next-line:no-shadowed-variable
      (expression: Expression) => {
        const variable: IDbExpressionVariable = {
          key: "",
          type: "EXPRESSION",
          expressionId: expression._build(schema).id
        };

        return addVariable(variable);
      },
      (column: string | Column) => {
        if (typeof column === "string") {
          const variable: IDbColumnNameVariable = {
            key: "",
            type: "COLUMN_NAME",
            columnName: column
          };

          return addVariable(variable);
        } else {
          const variable: IDbColumnIdVariable = {
            key: "",
            type: "COLUMN_ID",
            columnId: column._getId()
          };

          return addVariable(variable);
        }
      }
    );

    const parts = [];
    parts.push(JSON.stringify(variables));
    parts.push(sqlTemplate);
    parts.push(this.definition.gqlReturnType);
    parts.push(this.definition.authRequired);
    parts.push(this.definition.excludeFromWhereClause);

    const id = uuidv5(parts.join(":"), schema._getId());
    const name = this.definition.name || id;

    const expression: IDbExpression = {
      id,
      name,
      gqlReturnType: this.definition.gqlReturnType,
      variables,
      sqlTemplate
    };

    if (this.definition.authRequired != null) {
      expression.authRequired = this.definition.authRequired === true;
    }
    if (this.definition.excludeFromWhereClause != null) {
      expression.excludeFromWhereClause = this.definition.excludeFromWhereClause === true;
    }

    schema._addDbExpression(expression);

    return expression;
  }
}
