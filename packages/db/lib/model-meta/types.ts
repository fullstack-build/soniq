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
  entityOptions: TEntityOptions;
  directives: string[];
  triggers: ITriggerDefinition[];
  synchronized: boolean;
}

export interface ITriggerDefinition {
  name: string;
  when: "BEFORE" | "AFTER" | "INSTEAD OF";
  operations: Array<"INSERT" | "UPDATE" | "DELETE">;
  functionName: string;
  functionArguments: any[];
}

interface IEntityOptionsExtra {
  deletable?: boolean;
  updatable?: boolean;
  triggers?: ITriggerDefinition[];
  auditing?: boolean;
}

export type TEntityOptions = EntityOptions & IEntityOptionsExtra;

export interface IColumnMeta {
  name: string;
  columnOptions: TColumnOptions;
  directives: string[];
  extensions: { [extensionName: string]: any };
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
