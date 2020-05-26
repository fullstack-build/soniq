import { Table } from "./table";
import { v5 as uuidv5 } from "uuid";
import { Expression } from "./expression";
import { IDbSchema, IDbExpression, IDbFunction } from "../migration/DbSchemaInterface";
import { IObjectTrace } from "soniq";

export type Identifier = string | number;

export interface ISchemaTable {
  table: Table;
  identifier: Identifier;
}

export class Schema {
  private _id: string | null = null;
  private _permissionViewSchema: string;
  private _schemas: string[];
  private _tables: ISchemaTable[] = [];
  private _expressions: Expression[] = [];
  private _dbExpressions: IDbExpression[] = [];
  private _customFunctions: CustomFunction[] = [];
  private _objectTrace: Error;

  public constructor(schemas: string[], permissionViewSchema: string = "_gql") {
    this._schemas = schemas;
    this._permissionViewSchema = permissionViewSchema;
    this._objectTrace = new Error("Schema");
  }

  public addTable(identifier: Identifier, table: Table): void {
    table._setSchema(this);

    this._tables.push({
      table,
      identifier,
    });
  }

  public addFunction(customFunction: CustomFunction): void {
    this._customFunctions.push(customFunction);
  }

  public _addExpression(expression: Expression): void {
    this._expressions.push(expression);
  }

  public _addDbExpression(dbExpression: IDbExpression): void {
    for (const loopDbExpression of this._dbExpressions) {
      if (loopDbExpression.id === dbExpression.id) {
        return;
      }
    }
    this._dbExpressions.push(dbExpression);
  }

  public _getId(): string | null {
    return this._id;
  }

  public _build(id: string): IDbSchema {
    this._id = id;

    const dbSchema: IDbSchema = {
      permissionViewSchema: this._permissionViewSchema,
      schemas: this._schemas,
    };

    this._tables.forEach(({ table, identifier }) => {
      if (this._id == null) {
        throw new Error("Id is missing. Should be set before");
      }
      table._setId(uuidv5(identifier.toString(), this._id));
    });

    dbSchema.tables = this._tables.map(({ table, identifier }) => {
      return table._build();
    });

    dbSchema.functions = this._customFunctions.map((customFunction) => {
      return customFunction._build();
    });

    dbSchema.expressions = this._dbExpressions;

    return dbSchema;
  }

  public _buildObjectTraces(appId: string): IObjectTrace[] {
    const objectTraces: IObjectTrace[] = [];

    if (this._id != null) {
      objectTraces.push({
        objectId: this._id,
        trace: this._objectTrace,
      });
    }

    this._tables.forEach(({ table, identifier }) => {
      table._buildObjectTraces().forEach((objectTrace: IObjectTrace) => {
        objectTraces.push(objectTrace);
      });
    });

    this._customFunctions.forEach((customFunction) => {
      customFunction._buildObjectTraces().forEach((objectTrace: IObjectTrace) => {
        objectTraces.push(objectTrace);
      });
    });

    this._expressions.forEach((expression) => {
      expression._buildObjectTraces().forEach((objectTrace: IObjectTrace) => {
        objectTraces.push(objectTrace);
      });
    });

    return objectTraces;
  }
}

export class CustomFunction {
  public customFunction: IDbFunction;
  private _objectTrace: Error;

  public constructor(customFunction: IDbFunction) {
    this.customFunction = customFunction;
    this._objectTrace = new Error(`Function "${customFunction.schema}"."${customFunction.name}"`);
  }

  public _build(): IDbFunction {
    return this.customFunction;
  }

  public _buildObjectTraces(): IObjectTrace[] {
    const objectTraces: IObjectTrace[] = [];

    objectTraces.push({
      objectId: `Function_"${this.customFunction.schema}"."${this.customFunction.name}"`,
      trace: this._objectTrace,
    });

    return objectTraces;
  }
}
