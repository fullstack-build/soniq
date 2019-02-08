import { pascal } from "change-case";

import { IDbMeta, IColumnType, IEnum, ITable, IColumn, IConstraint } from "@fullstack-one/schema-builder";

export function mapDbMetaToTypeDefinitions(dbMeta: IDbMeta): string {
  const tsEnums: string = mapDbMetaEnumsToTypescriptEnums(dbMeta.enums);
  const tsInterfaces: string = mapDbMetaTablesToTypescriptInterfaces(dbMeta.schemas.public.tables, Object.keys(dbMeta.enums));

  return `${tsEnums}\n\n${tsInterfaces}\n`;
}

function mapDbMetaEnumsToTypescriptEnums(dbMetaEnums: { [name: string]: IEnum }): string {
  return Object.values(dbMetaEnums)
    .map((enumItem) => {
      const values: string = enumItem.values.map((value) => `  ${pascal(value)} = "${value}"`).join(",\n");
      return `export enum ${enumItem.name} {\n${values}\n}`;
    })
    .join("\n\n");
}

function mapDbMetaTablesToTypescriptInterfaces(dbMetaTables: { [name: string]: ITable }, enums: string[] = []): string {
  return Object.values(dbMetaTables)
    .map((table) => {
      const constraints = table.constraints;
      const tsProperties: string = Object.values(table.columns)
        .map((column) => mapDbMetaColumnToTypescriptProperty(column, constraints, enums))
        .join("\n");
      return `export interface I${pascal(table.name)} {\n${tsProperties}\n}`;
    })
    .join("\n\n");
}

function mapDbMetaColumnToTypescriptProperty(dbMetaColumn: IColumn, constraints: { [name: string]: IConstraint }, enums: string[]): string {
  const { name, type, constraintNames, customType, defaultValue } = dbMetaColumn;
  const property: string = `${name}${isMandatory(constraintNames, constraints) ? "" : "?"}`;
  const tsType: string = dbMetaColumnTypeToTypescriptType(type, customType, enums);
  const comment = [type, `${customType || ""}`, `${defaultValue ? defaultValue.value || "" : ""}`].filter((item) => item !== "").join(" ");

  return `  ${property}: ${tsType}; // ${comment}`;
}

function isMandatory(constraintNames: string[] | undefined, constraints: { [name: string]: IConstraint }): boolean {
  if (constraintNames == null) return false;
  return constraintNames.find((constraintName) => constraints[constraintName].type === "NOT NULL") !== undefined;
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
  if (columnType === "enum" && enums.includes(customType)) return customType;
  if (columnType === "customType" && customType === "timestamp") return "string";
  return map[columnType];
}
