export type IColumnType =
  | "computed"
  | "customResolver"
  | "varchar"
  | "int4"
  | "float8"
  | "bool"
  | "uuid"
  | "jsonb"
  | "relation"
  | "enum"
  | "customType";

export interface IColumn {
  name: string;
  oldName?: string;
  description?: string;
  type: IColumnType;
  customType?: string;
  defaultValue?: {
    value: "string";
  };
  relationName?: string;
  constraintNames?: string[];
  extensions?: {
    [name: string]: any;
  };
}

export type IConstraintType = "PRIMARY KEY" | "NOT NULL" | "UNIQUE" | "CHECK";

export interface IConstraint {
  name: string;
  type: IConstraintType;
  columns?: string[];
  options?: [any];
}

export interface ITable {
  schemaName: string;
  oldSchemaName?: string;
  name: string;
  oldName?: string;
  exposedNames?: string[];
  description?: string;
  extensions?: {
    [name: string]: any;
  };
  columns: {
    [name: string]: IColumn;
  };
  constraints?: {
    [name: string]: IConstraint;
  };
}

export interface ISchema {
  name: string;
  oldName?: string;
  tables?: {
    [name: string]: ITable;
  };
  views?: any;
}

export interface IEnumColumn {
  schemaName: string;
  tableName: string;
  columnName: string;
}

export interface IEnum {
  name: string;
  values: string[];
  columns?: {
    [name: string]: IEnumColumn;
  };
}

export interface IDbRelation {
  name: string;
  schemaName: string;
  tableName: string;
  columnName?: string;
  virtualColumnName: string;
  type: "ONE" | "MANY";
  onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
  onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
  description?: string;
  reference?: {
    schemaName: string;
    tableName: string;
    columnName?: string;
  };
}

export interface IDbMeta {
  version: number;
  schemas?: {
    [name: string]: ISchema;
  };
  enums?: {
    [name: string]: IEnum;
  };
  relations?: {
    [name: string]: {
      [sideName: string]: IDbRelation;
    };
  };
  exposedNames?: {
    [name: string]: {
      schemaName: string;
      tableName: string;
    };
  };
}
