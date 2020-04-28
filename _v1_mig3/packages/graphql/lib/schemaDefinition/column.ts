import { IDbColumn } from "../migration/DbSchemaInterface";
import { Table } from "./table";
import { Schema } from "./schema";
import { Expression } from "./expression";

export class Column {
  private id: string;
  private name: string;
  private type: string;
  private table: Table;
  private queryExpressions: Expression[] = [];
  public properties: any;

  constructor(name: string, type: string, properties?: any) {
    this.name = name;
    this.type = type;
    this.properties = properties || {};
  }

  public _get(id: string): IDbColumn {
    return {
      id,
      name: this.name,
      type: this.type,
      properties: this.properties,
      queryExpressionIds: []
    };
  }

  public _getId() {
    if (this.id == null) {
      throw new Error(`Id is not yet set on column "${this.name}". Have you used a column of a different table in an expression?`);
    }
    return this.id;
  }

  public _setTable(table: Table) {
    if (this.table != null) {
      throw new Error(`The column ${this.name} is already added to a table.`);
    }

    this.table = table;
  }

  public _getTable(): Table {
    return this.table;
  }

  public _setQueryExpressions(queryExpressions: Expression | Expression[]) {
    this.queryExpressions = Array.isArray(queryExpressions) ? queryExpressions : [queryExpressions];
  }

  public _setId(id: string) {
    this.id = id;
  }

  public _build(): IDbColumn {
    const schema: Schema = this.table._getSchema();

    this._preBuild();

    const queryDbExpressions = this.queryExpressions.map((queryExpression) => {
      return queryExpression._build(schema);
    });

    const column: IDbColumn = {
      id: this.id,
      type: this.type,
      name: this.name,
      properties: this.properties,
      queryExpressionIds: queryDbExpressions.map((queryDbExpression) => {
        return queryDbExpression.id;
      })
    };

    return column;
  }

  public _preBuild() {
    return;
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
  constructor(name: string, type: GenericTypes, properties?: IGenericColumnProperties) {
    super(name, type, properties || {});
  }
}

// ID column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class IdColumn extends Column {
  constructor() {
    super("id", "id", {});
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

// tslint:disable-next-line:max-classes-per-file
export class ManyToOneColumn extends Column {
  private getForeignTable: () => Table;

  constructor(name: string, foreignTable: () => Table, properties: IManyToOneColumnProperties = {}) {
    super(name, "manyToOne", properties);
    this.getForeignTable = foreignTable;
  }

  public _preBuild() {
    this.properties.foreignTableId = this.getForeignTable()._getId();

    return;
  }
}

// OneToMany column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class OneToManyColumn extends Column {
  private getForeignColumn: () => ManyToOneColumn;

  constructor(name: string, foreignColumn: () => ManyToOneColumn) {
    super(name, "oneToMany", {});
    this.getForeignColumn = foreignColumn;
  }

  public _preBuild() {
    this.properties.foreignColumnId = this.getForeignColumn()._getId();

    return;
  }
}

// Computed column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class ComputedColumn extends Column {
  private getExpression: () => Expression;
  private moveSelectToQuery: boolean = null;

  constructor(name: string, expression: () => Expression, moveSelectToQuery?: boolean) {
    super(name, "computed", {});
    this.getExpression = expression;

    if (moveSelectToQuery != null) {
      this.moveSelectToQuery = moveSelectToQuery;
    }
  }

  public _preBuild() {
    this.properties.expressionId = this.getExpression()._build(this._getTable()._getSchema()).id;

    if (this.moveSelectToQuery != null) {
      this.properties.expressionId.moveSelectToQuery = this.moveSelectToQuery;
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
  constructor(name: string, values: string[], properties: IEnumColumnProperties = {}) {
    super(name, "enum", {
      ...properties,
      values
    });
  }
}

// createdAt column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class CreatedAtColumn extends Column {
  constructor() {
    super("createdAt", "createdAt", {});
  }
}

// updatedAt column ===============================================

// tslint:disable-next-line:max-classes-per-file
export class UpdatedAtColumn extends Column {
  constructor() {
    super("updatedAt", "updatedAt", {});
  }
}
