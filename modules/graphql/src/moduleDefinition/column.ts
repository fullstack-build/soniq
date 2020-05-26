import { IDbColumn, IDbExpression } from "../migration/DbSchemaInterface";
import { Table } from "./table";
import { Schema } from "./schema";
import { Expression } from "./expression";
import { IObjectTrace } from "soniq";

export class Column {
  private _id: string | null = null;
  private _name: string;
  private _type: string;
  private _table: Table | null = null;
  private _queryExpressions: Expression[] = [];
  public _objectTrace: Error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public properties: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(name: string, type: string, properties?: any) {
    this._objectTrace = new Error(`Column "${name}" of type "${type}"`);
    this._name = name;
    this._type = type;
    this.properties = properties || {};
  }

  public _get(id: string): IDbColumn {
    return {
      id,
      name: this._name,
      type: this._type,
      properties: this.properties,
      queryExpressionIds: [],
    };
  }

  public _getId(): string {
    if (this._id == null) {
      throw new Error(
        `Id is not yet set on column "${this._name}". Have you used a column of a different table in an expression?`
      );
    }
    return this._id;
  }

  public _setTable(table: Table): void {
    if (this._table != null) {
      throw new Error(`The column ${this._name} is already added to a table.`);
    }

    this._table = table;
  }

  public _getTable(): Table | null {
    return this._table;
  }

  public _setQueryExpressions(queryExpressions: Expression | Expression[]): void {
    this._queryExpressions = Array.isArray(queryExpressions) ? queryExpressions : [queryExpressions];
  }

  public _setId(id: string): void {
    this._id = id;
  }

  public _build(): IDbColumn {
    if (this._table == null) {
      throw new Error("This column is not registered in any table. Missing table.");
    }
    const schema: Schema | null = this._table._getSchema();

    if (schema == null) {
      throw new Error("This column is not registered in any table. Missing schema.");
    }

    this._preBuild();

    const queryDbExpressions: IDbExpression[] = this._queryExpressions.map(
      (queryExpression: Expression): IDbExpression => {
        return queryExpression._build(schema);
      }
    );

    if (this._id == null) {
      throw new Error("This column is not registered in any table. Missing id.");
    }

    const column: IDbColumn = {
      id: this._id,
      type: this._type,
      name: this._name,
      properties: this.properties,
      queryExpressionIds: queryDbExpressions.map((queryDbExpression) => {
        return queryDbExpression.id;
      }),
    };

    return column;
  }

  public _preBuild(): void {
    return;
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

// Generic column ===============================================

export type GenericTypes =
  | "text"
  | "textArray"
  | "uuid"
  | "int"
  | "intArray"
  | "bigint"
  | "bigintArray"
  | "float"
  | "boolean"
  | "dateTimeUTC"
  | "json"
  | "jsonb";

export interface IGenericColumnProperties {
  nullable?: boolean;
  defaultExpression?: string;
  moveSelectToQuery?: boolean;
}

// tslint:disable-next-line:max-classes-per-file
export class GenericColumn extends Column {
  public constructor(name: string, type: GenericTypes, properties?: IGenericColumnProperties) {
    super(name, type, properties || {});

    this._objectTrace = new Error(`GenericColumn "${name}" of type "${type}"`);
  }
}

// ID column ===============================================

export class IdColumn extends Column {
  public constructor() {
    super("id", "id", {});

    this._objectTrace = new Error(`IdColumn`);
  }
}

// ManyToOne column ===============================================

export interface IManyToOneColumnProperties {
  nullable?: boolean;
  defaultExpression?: string;
  onUpdate?: "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
  onDelete?: "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
  validation?: "NOT DEFERRABLE" | "INITIALLY DEFERRED" | "DEFERRABLE";
}

export class ManyToOneColumn extends Column {
  private _getForeignTable: () => Table;

  public constructor(name: string, foreignTable: () => Table, properties: IManyToOneColumnProperties = {}) {
    super(name, "manyToOne", properties);
    this._getForeignTable = foreignTable;

    this._objectTrace = new Error(`ManyToOneColumn "${name}"`);
  }

  public _preBuild(): void {
    this.properties.foreignTableId = this._getForeignTable()._getId();

    return;
  }
}

// OneToMany column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class OneToManyColumn extends Column {
  private _getForeignColumn: () => ManyToOneColumn;

  public constructor(name: string, foreignColumn: () => ManyToOneColumn) {
    super(name, "oneToMany", {});
    this._getForeignColumn = foreignColumn;

    this._objectTrace = new Error(`OneToManyColumn "${name}"`);
  }

  public _preBuild(): void {
    this.properties.foreignColumnId = this._getForeignColumn()._getId();

    return;
  }
}

// Computed column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class ComputedColumn extends Column {
  private _getExpression: () => Expression;
  private _moveSelectToQuery: boolean | null = null;

  public constructor(name: string, expression: () => Expression, moveSelectToQuery?: boolean) {
    super(name, "computed", {});
    this._getExpression = expression;

    if (moveSelectToQuery != null) {
      this._moveSelectToQuery = moveSelectToQuery;
    }

    this._objectTrace = new Error(`ComputedColumn "${name}"`);
  }

  public _preBuild(): void {
    const table: Table | null = this._getTable();

    if (table == null) {
      throw new Error("Could not get table.");
    }

    const schema: Schema | null = table._getSchema();

    if (schema == null) {
      throw new Error("Could not get schema.");
    }

    this.properties.expressionId = this._getExpression()._build(schema).id;

    if (this._moveSelectToQuery != null) {
      this.properties.expressionId.moveSelectToQuery = this._moveSelectToQuery;
    }

    return;
  }
}

// Enum column ===============================================

export interface IEnumColumnProperties {
  nullable?: boolean;
  defaultExpression?: string;
}

// tslint:disable-next-line:max-classes-per-file
export class EnumColumn extends Column {
  public constructor(name: string, values: string[], properties: IEnumColumnProperties = {}) {
    super(name, "enum", {
      ...properties,
      values,
    });

    this._objectTrace = new Error(`EnumColumn "${name}"`);
  }
}

// createdAt column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class CreatedAtColumn extends Column {
  public constructor() {
    super("createdAt", "createdAt", {});

    this._objectTrace = new Error(`CreatedAtColumn`);
  }
}

// updatedAt column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class UpdatedAtColumn extends Column {
  public constructor() {
    super("updatedAt", "updatedAt", {});

    this._objectTrace = new Error(`UpdatedAtColumn`);
  }
}
