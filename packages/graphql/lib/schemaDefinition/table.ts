import { Identifier, Schema } from "./schema";
import { Column, IdColumn } from "./column";
import { Expression } from "./expression";
import { v5 as uuidv5 } from "uuid";
import { IDbTable, IDbColumn, IDbMutation, IDbCheck, IDbIndex, IDbTableOptions } from "../migration/DbSchemaInterface";

export interface ITableColumn {
  column: Column;
  identifier: Identifier;
}

export class Table {
  private id: string;
  private columns: ITableColumn[] = [];
  private mutations: Mutation[] = [];
  private indexes: Index[] = [];
  private checks: Check[] = [];
  private schema: Schema;
  private name: string;
  private schemaName: string;
  private options: IDbTableOptions;

  constructor(name: string, schemaName: string, options?: IDbTableOptions) {
    this.name = name;
    this.schemaName = schemaName;
    this.options = options || null;
  }

  public addColumn(identifier: Identifier, column: Column, queryExpressions?: Expression | Expression[]) {
    this.columns.forEach((tableColumn) => {
      if (tableColumn.identifier === identifier) {
        throw new Error(`The column-identifiert "${identifier}" is used more than once in table "${this.name}".`);
      }
    });

    column._setTable(this);

    if (queryExpressions != null) {
      column._setQueryExpressions(queryExpressions);
    }

    this.columns.push({
      column,
      identifier
    });
  }

  public addMutation(mutation: Mutation) {
    // TODO: Check for duplicate delete-mutations and name conflicts

    mutation._setTable(this);

    this.mutations.push(mutation);
  }

  public addCheck(check: Check) {
    // TODO: Check for duplicate delete-mutations and name conflicts

    check._setTable(this);

    this.checks.push(check);
  }

  public addIndex(index: Index) {
    // TODO: Check for duplicate delete-mutations and name conflicts

    index._setTable(this);

    this.indexes.push(index);
  }

  public _setSchema(schema: Schema) {
    if (this.schema != null) {
      throw new Error(`The table ${this.name} is already added to a schema.`);
    }

    this.schema = schema;
  }

  public _getSchema(): Schema {
    return this.schema;
  }

  public _getId(): string {
    return this.id;
  }

  public _setId(id: string) {
    this.id = id;

    this.columns.forEach(({ column, identifier }) => {
      column._setId(uuidv5(identifier.toString(), this.id));
    });
  }

  public _build(): IDbTable {
    const columns: IDbColumn[] = this.columns.map(({ column, identifier }) => {
      return column._build();
    });

    const mutations: IDbMutation[] = this.mutations.map((mutation) => {
      return mutation._build();
    });

    const checks: IDbCheck[] = this.checks.map((check) => {
      return check._build();
    });

    const table: IDbTable = {
      id: this.id,
      schema: this.schemaName,
      name: this.name,
      columns,
      mutations,
      checks
    };

    if (this.options != null) {
      table.options = this.options;
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
  private columns: Column[];
  private properties: IIndexProperties;
  private table: Table;

  constructor(columns: Column[], properties: IIndexProperties = {}) {
    this.columns = columns;
    this.properties = properties;
  }

  public _setTable(table: Table) {
    if (this.table != null) {
      throw new Error(`This index is already added to a table.`);
    }

    this.table = table;
  }

  public _getTable(): Table {
    return this.table;
  }

  public _build(): IDbIndex {
    const columnIds: string[] = this.columns.map((column) => {
      return column._getId();
    });

    const parts = [JSON.stringify(columnIds), this.properties.isUniqueIndex, this.properties.condition, this.properties.accessMethod];

    const id = uuidv5(parts.join(":"), this.table._getId());

    const index: IDbIndex = {
      id,
      columnIds
    };

    if (this.properties.accessMethod != null) {
      index.accessMethod = this.properties.accessMethod;
    }

    if (this.properties.condition != null) {
      index.condition = this.properties.condition;
    }

    if (this.properties.isUniqueIndex != null) {
      index.isUniqueIndex = this.properties.isUniqueIndex;
    }

    return index;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class Check {
  private definition: string;
  private table: Table;

  constructor(definition: string) {
    this.definition = definition;
  }

  public _setTable(table: Table) {
    if (this.table != null) {
      throw new Error(`This check is already added to a table.`);
    }

    this.table = table;
  }

  public _getTable(): Table {
    return this.table;
  }

  public _build(): IDbCheck {
    const check: IDbCheck = {
      id: uuidv5(this.definition, this.table._getId()),
      definition: this.definition
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
  private properties: IMutationProperties;
  private table: Table;

  constructor(properties: IMutationProperties) {
    this.properties = properties;
  }

  public _setTable(table: Table) {
    if (this.table != null) {
      throw new Error(`The mutation ${this.properties.name} is already added to a table.`);
    }

    this.table = table;
  }

  public _getTable(): Table {
    return this.table;
  }

  public _build(): IDbMutation {
    const columns = this.properties.columns.map(({ column, isRequired }) => {
      return {
        columnId: column._getId(),
        isRequired
      };
    });

    const expressionIds = this.properties.expressions.map((expression) => {
      return expression._build(this.table._getSchema()).id;
    });

    const mutation: IDbMutation = {
      id: uuidv5(this.properties.name, this.table._getId()),
      name: this.properties.name,
      type: this.properties.type,
      columns,
      expressionIds
    };

    if (this.properties.returnOnlyId != null) {
      mutation.returnOnlyId = this.properties.returnOnlyId;
    }

    return mutation;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class CreateMutation extends Mutation {
  constructor(name: string, columns: Array<IMutationColumn | Column>, expressions: Expression | Expression[], returnOnlyId?: boolean) {
    const properties: IMutationProperties = {
      name,
      type: "CREATE",
      columns: columns.map((column) => {
        return column instanceof Column ? { column } : column;
      }),
      expressions: Array.isArray(expressions) ? expressions : [expressions]
    };

    if (returnOnlyId != null) {
      properties.returnOnlyId = returnOnlyId;
    }

    super(properties);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class UpdateMutation extends Mutation {
  constructor(name: string, columns: Array<IMutationColumn | Column>, expressions: Expression | Expression[], returnOnlyId?: boolean) {
    const properties: IMutationProperties = {
      name,
      type: "UPDATE",
      columns: columns.map((column) => {
        return column instanceof Column ? { column } : column;
      }),
      expressions: Array.isArray(expressions) ? expressions : [expressions]
    };

    if (returnOnlyId != null) {
      properties.returnOnlyId = returnOnlyId;
    }

    super(properties);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class DeleteMutation extends Mutation {
  constructor(idColumn: IdColumn, expressions: Expression | Expression[]) {
    super({
      name: "",
      type: "DELETE",
      columns: [
        {
          column: idColumn,
          isRequired: true
        }
      ],
      expressions: Array.isArray(expressions) ? expressions : [expressions]
    });
  }
}
