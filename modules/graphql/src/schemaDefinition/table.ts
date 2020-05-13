import { Identifier, Schema } from "./schema";
import { Column, IdColumn } from "./column";
import { Expression } from "./expression";
import { v5 as uuidv5 } from "uuid";
import {
  IDbTable,
  IDbColumn,
  IDbMutation,
  IDbCheck,
  IDbIndex,
  IDbTableOptions,
  IDbMutationColumn,
} from "../migration/DbSchemaInterface";

export interface ITableColumn {
  column: Column;
  identifier: Identifier;
}

export class Table {
  private _id: string | null = null;
  private _columns: ITableColumn[] = [];
  private _mutations: Mutation[] = [];
  private _indexes: Index[] = [];
  private _checks: Check[] = [];
  private _schema: Schema | null = null;
  private _name: string;
  private _schemaName: string;
  private _options: IDbTableOptions | null;

  public constructor(name: string, schemaName: string, options?: IDbTableOptions) {
    this._name = name;
    this._schemaName = schemaName;
    this._options = options || null;
  }

  public addColumn(identifier: Identifier, column: Column, queryExpressions?: Expression | Expression[]): void {
    this._columns.forEach((tableColumn) => {
      if (tableColumn.identifier === identifier) {
        throw new Error(`The column-identifiert "${identifier}" is used more than once in table "${this._name}".`);
      }
    });

    column._setTable(this);

    if (queryExpressions != null) {
      column._setQueryExpressions(queryExpressions);
    }

    this._columns.push({
      column,
      identifier,
    });
  }

  public addMutation(mutation: Mutation): void {
    // TODO: Check for duplicate delete-mutations and name conflicts

    mutation._setTable(this);

    this._mutations.push(mutation);
  }

  public addCheck(check: Check): void {
    // TODO: Check for duplicate delete-mutations and name conflicts

    check._setTable(this);

    this._checks.push(check);
  }

  public addIndex(index: Index): void {
    // TODO: Check for duplicate delete-mutations and name conflicts

    index._setTable(this);

    this._indexes.push(index);
  }

  public _setSchema(schema: Schema): void {
    if (this._schema != null) {
      throw new Error(`The table ${this._name} is already added to a schema.`);
    }

    this._schema = schema;
  }

  public _getSchema(): Schema | null {
    return this._schema;
  }

  public _getId(): string | null {
    return this._id;
  }

  public _setId(id: string): void {
    this._id = id;

    this._columns.forEach(({ column, identifier }) => {
      //@ts-ignore TODO: @eugene this.id is set before
      column._setId(uuidv5(identifier.toString(), this._id));
    });
  }

  public _build(): IDbTable {
    if (this._id == null) {
      throw new Error("Id is not yet set.");
    }

    const columns: IDbColumn[] = this._columns.map(({ column, identifier }) => {
      return column._build();
    });

    const mutations: IDbMutation[] = this._mutations.map((mutation) => {
      return mutation._build();
    });

    const checks: IDbCheck[] = this._checks.map((check) => {
      return check._build();
    });

    const table: IDbTable = {
      id: this._id,
      schema: this._schemaName,
      name: this._name,
      columns,
      mutations,
      checks,
    };

    if (this._options != null) {
      table.options = this._options;
    }

    return table;
  }
}

export interface IIndexProperties {
  isUniqueIndex?: boolean;
  condition?: string;
  accessMethod?: "btree" | "hash" | "gist" | "gin" | "spgist" | "brin";
}

// tslint:disable-next-line:max-classes-per-file
export class Index {
  private _columns: Column[];
  private _properties: IIndexProperties;
  private _table: Table | null = null;

  public constructor(columns: Column[], properties: IIndexProperties = {}) {
    this._columns = columns;
    this._properties = properties;
  }

  public _setTable(table: Table): void {
    if (this._table != null) {
      throw new Error(`This index is already added to a table.`);
    }

    this._table = table;
  }

  public _getTable(): Table | null {
    return this._table;
  }

  public _build(): IDbIndex {
    if (this._table == null) {
      throw new Error(`This index has not been added to an index.`);
    }
    const tableId: string | null = this._table._getId();
    if (tableId == null) {
      throw new Error(`This index has not been added to an index.`);
    }

    const columnIds: string[] = this._columns.map((column) => {
      return column._getId();
    });

    const parts: unknown[] = [
      JSON.stringify(columnIds),
      this._properties.isUniqueIndex,
      this._properties.condition,
      this._properties.accessMethod,
    ];

    const id: string = uuidv5(parts.join(":"), tableId);

    const index: IDbIndex = {
      id,
      columnIds,
    };

    if (this._properties.accessMethod != null) {
      index.accessMethod = this._properties.accessMethod;
    }

    if (this._properties.condition != null) {
      index.condition = this._properties.condition;
    }

    if (this._properties.isUniqueIndex != null) {
      index.isUniqueIndex = this._properties.isUniqueIndex;
    }

    return index;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class Check {
  private _definition: string;
  private _table: Table | null = null;

  public constructor(definition: string) {
    this._definition = definition;
  }

  public _setTable(table: Table): void {
    if (this._table != null) {
      throw new Error(`This check is already added to a table.`);
    }

    this._table = table;
  }

  public _getTable(): Table | null {
    return this._table;
  }

  public _build(): IDbCheck {
    if (this._table == null) {
      throw new Error(`This index has not been added to an index.`);
    }
    const tableId: string | null = this._table._getId();
    if (tableId == null) {
      throw new Error(`This index has not been added to an index.`);
    }

    const check: IDbCheck = {
      id: uuidv5(this._definition, tableId),
      definition: this._definition,
    };

    return check;
  }
}

export interface IMutationColumn {
  column: Column;
  isRequired?: boolean;
}

export interface IMutationProperties {
  name: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  columns: IMutationColumn[];
  expressions: Expression[];
  returnOnlyId?: boolean;
}

// tslint:disable-next-line:max-classes-per-file
export class Mutation {
  private _properties: IMutationProperties;
  private _table: Table | null = null;

  public constructor(properties: IMutationProperties) {
    this._properties = properties;
  }

  public _setTable(table: Table): void {
    if (this._table != null) {
      throw new Error(`The mutation ${this._properties.name} is already added to a table.`);
    }

    this._table = table;
  }

  public _getTable(): Table | null {
    return this._table;
  }

  public _build(): IDbMutation {
    if (this._table == null) {
      throw new Error(`This mutation has not been added to a table.`);
    }
    const schema: Schema | null = this._table._getSchema();
    const tableId: string | null = this._table._getId();
    if (schema == null) {
      throw new Error(`This mutation has not been added to a table.`);
    }
    if (tableId == null) {
      throw new Error(`This mutation has not been added to a table.`);
    }
    const columns: IDbMutationColumn[] = this._properties.columns.map(({ column, isRequired }) => {
      return {
        columnId: column._getId(),
        isRequired,
      };
    });

    const expressionIds: string[] = this._properties.expressions.map((expression) => {
      return expression._build(schema).id;
    });

    const mutation: IDbMutation = {
      id: uuidv5(this._properties.name, tableId),
      name: this._properties.name,
      type: this._properties.type,
      columns,
      expressionIds,
    };

    if (this._properties.returnOnlyId != null) {
      mutation.returnOnlyId = this._properties.returnOnlyId;
    }

    return mutation;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class CreateMutation extends Mutation {
  public constructor(
    name: string,
    columns: (IMutationColumn | Column)[],
    expressions: Expression | Expression[],
    returnOnlyId?: boolean
  ) {
    const properties: IMutationProperties = {
      name,
      type: "CREATE",
      columns: columns.map((column) => {
        return column instanceof Column ? { column } : column;
      }),
      expressions: Array.isArray(expressions) ? expressions : [expressions],
    };

    if (returnOnlyId != null) {
      properties.returnOnlyId = returnOnlyId;
    }

    super(properties);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class UpdateMutation extends Mutation {
  public constructor(
    name: string,
    columns: (IMutationColumn | Column)[],
    expressions: Expression | Expression[],
    returnOnlyId?: boolean
  ) {
    const properties: IMutationProperties = {
      name,
      type: "UPDATE",
      columns: columns.map((column) => {
        return column instanceof Column ? { column } : column;
      }),
      expressions: Array.isArray(expressions) ? expressions : [expressions],
    };

    if (returnOnlyId != null) {
      properties.returnOnlyId = returnOnlyId;
    }

    super(properties);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class DeleteMutation extends Mutation {
  public constructor(idColumn: IdColumn, expressions: Expression | Expression[]) {
    super({
      name: "",
      type: "DELETE",
      columns: [
        {
          column: idColumn,
          isRequired: true,
        },
      ],
      expressions: Array.isArray(expressions) ? expressions : [expressions],
    });
  }
}
