import { ColumnOptions, EntityOptions } from "typeorm";

export interface IModelMeta {
  entities: {
    [entityName: string]: IEntityMeta;
  };
  enums: {
    [enumName: string]: IEnumMeta;
  };
}

export interface IEntityMeta {
  name: string;
  columns: {
    [columnName: string]: IColumnMeta;
  };
  directives: string[];
  entityOptions: TEntityOptions;
  synchronized: boolean;
}

export type TEntityOptions = EntityOptions;

export interface IColumnMeta {
  name: string;
  directives: string[];
  columnOptions: TColumnOptions;
  synchronized: boolean;
}

interface IExtraColumnOptions {
  gqlType?: GqlScalarFieldType | string;
  enum?: object;
  enumName?: string;
}

type GqlScalarFieldType = "String" | "Int" | "Float" | "Boolean" | "JSON" | "ID";

export type TColumnOptions = ColumnOptions & IExtraColumnOptions;

export interface IEnumMeta {
  name: string;
  values: string[];
}
