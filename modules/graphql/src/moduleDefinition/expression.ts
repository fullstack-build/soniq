import { Column } from "./column";
import {
  IDbVariable,
  IDbExpressionVariable,
  IDbColumnNameVariable,
  IDbColumnIdVariable,
  IDbExpression,
} from "../migration/DbSchemaInterface";

import { v5 as uuidv5 } from "uuid";
import { Schema } from "./schema";
import { IObjectTrace } from "soniq";

export interface IExpression {
  gqlReturnType: string;
  authRequired?: boolean;
  excludeFromWhereClause?: boolean;
  name?: string;
  generateSql: (
    getExpression: (expression: Expression) => string,
    getColumn: (column: string | Column) => string
  ) => string;
}

export class Expression {
  private _definition: IExpression;
  private _objectTrace: Error;
  private _id: string | null = null;

  public constructor(definition: IExpression) {
    this._definition = definition;

    this._objectTrace = new Error(`Expression "${definition.name}"`);
  }

  public _build(schema: Schema): IDbExpression {
    const variables: IDbVariable[] = [];

    const addVariable: (variable: IDbVariable) => string = (variable: IDbVariable): string => {
      const key: string = `v${variables.length}`;

      variables.push({
        ...variable,
        key,
      });

      return `\${${key}}`;
    };

    const sqlTemplate: string = this._definition.generateSql(
      // tslint:disable-next-line:no-shadowed-variable
      (expression: Expression) => {
        const variable: IDbExpressionVariable = {
          key: "",
          type: "EXPRESSION",
          expressionId: expression._build(schema).id,
        };

        return addVariable(variable);
      },
      (column: string | Column) => {
        if (typeof column === "string") {
          const variable: IDbColumnNameVariable = {
            key: "",
            type: "COLUMN_NAME",
            columnName: column,
          };

          return addVariable(variable);
        } else {
          const variable: IDbColumnIdVariable = {
            key: "",
            type: "COLUMN_ID",
            columnId: column._getId(),
          };

          return addVariable(variable);
        }
      }
    );

    const parts: unknown[] = [];
    parts.push(JSON.stringify(variables));
    parts.push(sqlTemplate);
    parts.push(this._definition.gqlReturnType);
    parts.push(this._definition.authRequired);
    parts.push(this._definition.excludeFromWhereClause);

    const schemaId: string | null = schema._getId();
    if (schemaId == null) {
      throw new Error("Schema is not ready yet.");
    }

    const id: string = uuidv5(parts.join(":"), schemaId);
    this._id = id;
    const name: string = this._definition.name || id;

    const expression: IDbExpression = {
      id,
      name,
      gqlReturnType: this._definition.gqlReturnType,
      variables,
      sqlTemplate,
    };

    if (this._definition.authRequired != null) {
      expression.authRequired = this._definition.authRequired === true;
    }
    if (this._definition.excludeFromWhereClause != null) {
      expression.excludeFromWhereClause = this._definition.excludeFromWhereClause === true;
    }

    schema._addDbExpression(expression);

    return expression;
  }

  public _buildObjectTraces(): IObjectTrace[] {
    const objectTraces: IObjectTrace[] = [];

    if (this._id != null) {
      objectTraces.push({
        objectId: this._id,
        trace: this._objectTrace,
      });
    }

    return objectTraces;
  }
}
