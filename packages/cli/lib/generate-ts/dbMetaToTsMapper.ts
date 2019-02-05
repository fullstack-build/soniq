import * as _ from "lodash";
import { pascal } from "change-case";

import { IDbMeta, IColumnType, IEnum, ITable, IColumn, IConstraint } from "@fullstack-one/schema-builder";

export function mapDbMetaToTypeDefinitions(dbMeta: IDbMeta): string {
  const tsEnums: string = mapDbMetaEnumsToTypescriptEnums(dbMeta.enums);
  const tsInterfaces: string = mapDbMetaTablesToTypescriptInterfaces(dbMeta.schemas.public.tables, _.map(dbMeta.enums, (value, key) => key));

  return `${tsEnums}\n\n${tsInterfaces}\n`;
}

function mapDbMetaEnumsToTypescriptEnums(dbMetaEnums: { [name: string]: IEnum }): string {
  return _.map(dbMetaEnums, (enumItem) => {
    const values: string = _.map(enumItem.values, (value) => `  ${pascal(value)} = "${value}"`).join(",\n");
    return `export enum ${enumItem.name} {\n${values}\n}`;
  }).join("\n\n");
}

function mapDbMetaTablesToTypescriptInterfaces(dbMetaTables: { [name: string]: ITable }, enums: string[] = []): string {
  return _.map(dbMetaTables, (table) => {
    const constraints = table.constraints;
    const tsProperties: string = _.map(table.columns, (column) => mapDbMetaColumnToTypescriptProperty(column, constraints, enums)).join("\n");
    return `export interface I${pascal(table.name)} {\n${tsProperties}\n}`;
  }).join("\n\n");
}

function mapDbMetaColumnToTypescriptProperty(dbMetaColumn: IColumn, constraints: { [name: string]: IConstraint }, enums: string[]): string {
  const { name, type, constraintNames, customType, defaultValue } = dbMetaColumn;
  const isMandatory = _.find(constraintNames, (constraintName) => constraints[constraintName].type === "NOT NULL") !== undefined;
  const property: string = `${name}${isMandatory ? "" : "?"}`;
  const tsType: string = dbMetaColumnTypeToTypescriptType(type, customType, enums);
  const comment = [type, `${customType || ""}`, `${defaultValue ? defaultValue.value || "" : ""}`].filter((item) => item !== "").join(" ");

  return `  ${property}: ${tsType}; // ${comment}`;
}

function dbMetaColumnTypeToTypescriptType(columnType: IColumnType, customType: string, enums: string[]): string {
  const map = {
    computed: "any",
    customResolver: "any",
    varchar: "string",
    int4: "number",
    float8: "number",
    bool: "boolean",
    uuid: "string",
    jsonb: "any",
    relation: "any",
    enum: "any",
    customType: "any"
  };
  if (columnType === "enum" && _.includes(enums, customType)) return customType;
  if (columnType === "customType" && customType === "timestamp") return "string";
  return map[columnType];
}
