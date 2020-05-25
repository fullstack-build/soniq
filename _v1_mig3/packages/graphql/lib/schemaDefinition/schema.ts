import { Table } from "./table";
import { v5 as uuidv5 } from "uuid";
import { Expression } from "./expression";
import { IDbSchema, IDbExpression, IDbFunction } from "../migration/DbSchemaInterface";

export type Identifier = string | number;

export interface ISchemaTable {
  table: Table;
  identifier: Identifier;
}

export class Schema {
  private id: string;
  private permissionViewSchema: string;
  private schemas: string[];
  private tables: ISchemaTable[] = [];
  private expressions: Expression[] = [];
  private dbExpressions: IDbExpression[] = [];
  private customFunctions: CustomFunction[] = [];

  constructor(schemas: string[], permissionViewSchema: string = "_gql") {
    this.schemas = schemas;
    this.permissionViewSchema = permissionViewSchema;
  }

  public addTable(identifier: Identifier, table: Table) {
    table._setSchema(this);

    this.tables.push({
      table,
      identifier
    });
  }

  public addFunction(customFunction: CustomFunction) {
    this.customFunctions.push(customFunction);
  }

  public _addExpression(expression: Expression) {
    this.expressions.push(expression);
  }

  public _addDbExpression(dbExpression: IDbExpression) {
    for (const i in this.dbExpressions) {
      if (this.dbExpressions[i].id === dbExpression.id) {
        return;
      }
    }
    this.dbExpressions.push(dbExpression);
  }

  public _getId(): string {
    return this.id;
  }

  public _build(id: string): IDbSchema {
    this.id = id;

    const dbSchema: IDbSchema = {
      permissionViewSchema: this.permissionViewSchema,
      schemas: this.schemas
    };

    this.tables.forEach(({ table, identifier }) => {
      table._setId(uuidv5(identifier.toString(), this.id));
    });

    dbSchema.tables = this.tables.map(({ table, identifier }) => {
      return table._build();
    });

    dbSchema.functions = this.customFunctions.map((customFunction) => {
      return customFunction._build();
    });

    dbSchema.expressions = this.dbExpressions;

    return dbSchema;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class CustomFunction {
  public customFunction: IDbFunction;

  constructor(customFunction: IDbFunction) {
    this.customFunction = customFunction;
  }

  public _build(): IDbFunction {
    return this.customFunction;
  }
}
