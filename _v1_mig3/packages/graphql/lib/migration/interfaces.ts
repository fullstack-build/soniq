import { IDbColumn, IDbSchema } from "./DbSchemaInterface";
import { ICommand, IMigrationError } from "@fullstack-one/core";

export interface IColumnInfo {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: any;
  is_nullable: string;
  data_type: string;
  character_maximum_length: any;
  character_octet_length: any;
  numeric_precision: any;
  numeric_precision_radix: any;
  numeric_scale: any;
  datetime_precision: any;
  interval_type: any;
  interval_precision: any;
  character_set_catalog: any;
  character_set_schema: any;
  character_set_name: any;
  collation_catalog: any;
  collation_schema: any;
  collation_name: any;
  domain_catalog: any;
  domain_schema: any;
  domain_name: any;
  udt_catalog: string;
  udt_schema: string;
  udt_name: string;
  scope_catalog: any;
  scope_schema: any;
  scope_name: any;
  maximum_cardinality: any;
  dtd_identifier: string;
  is_self_referencing: string;
  is_identity: string;
  identity_generation: any;
  identity_start: any;
  identity_increment: any;
  identity_maximum: any;
  identity_minimum: any;
  identity_cycle: string;
  is_generated: string;
  generation_expression: any;
  is_updatable: string;
  // Custom (Via Subqueries):
  comment: string;
  // Custom (Via JS):
  id: string;
  type: string;
  userComment: string;
}

export interface IGqlCommand extends ICommand {
  autoSchemaFixes?: IAutoSchemaFix[];
}

export interface IAutoSchemaFix {
  tableId?: string;
  columnId?: string;
  checkId?: string;
  indexId?: string;
  key: string;
  value: any;
}

export interface IGqlMigrationResult {
  errors: IMigrationError[];
  warnings: IMigrationError[];
  commands: IGqlCommand[];
}

export interface IUpdateColumns {
  [columnId: string]: IUpdateColumn;
}

export interface IUpdateColumn {
  columnInfo: IColumnInfo;
  column: IDbColumn;
}

export interface IMigrationOptions {
  runMigration: boolean;
  runAutoFix: boolean;
}

export interface ITableMeta {
  schema: string;
  name: string;
  comment: string;
  id: string | null;
}

export interface ITableMetaByTableId {
  [tableId: string]: ITableMeta;
}
