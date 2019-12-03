import { createGenericColumnExtension } from "./factory";
import { IColumnInfo } from "../../interfaces";
import { IColumnExtensionContext } from "../IColumnExtension";

export const columnExtensionText = createGenericColumnExtension(
  {
    type: "text",
    gqlType: "String",
    gqlInputType: "String",
    tsType: "string",
    tsInputType: "string",
    pgDataType: "text"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "text":
      case "character varying":
        return [];
      case "integer":
      case "double precision":
      case "boolean":
      case "uuid":
        return [`ALTER TABLE "${context.table.schema}"."${context.table.name}" ALTER COLUMN "${context.column.name}" TYPE text;`];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to text.`);
    }
  }
);

export const columnExtensionUuid = createGenericColumnExtension(
  {
    type: "uuid",
    gqlType: "ID",
    gqlInputType: "ID",
    tsType: "string",
    tsInputType: "string",
    pgDataType: "uuid"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "text":
      case "character varying":
        return [`ALTER TABLE "${context.table.schema}"."${context.table.name}" ALTER COLUMN "${context.column.name}" TYPE uuid;`];
      case "uuid":
        return [];
      case "integer":
      case "double precision":
      case "boolean":
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to uuid.`);
    }
  }
);

export const columnExtensionTextArray = createGenericColumnExtension(
  {
    type: "textArray",
    gqlType: "[String]",
    gqlInputType: "[String]",
    tsType: "string[]",
    tsInputType: "string[]",
    pgDataType: "text[]"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    if (columnInfo.data_type === "ARRAY" && columnInfo.udt_name === "_text") {
      return [];
    } else {
      throw new Error(`Cannot migrate type ${columnInfo.data_type} [${columnInfo.udt_name}] to textArray.`);
    }
  }
);

export const columnExtensionInt = createGenericColumnExtension(
  {
    type: "int",
    gqlType: "Int",
    gqlInputType: "Int",
    tsType: "number",
    tsInputType: "number",
    pgDataType: "integer"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "integer":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to integer.`);
    }
  }
);

export const columnExtensionIntArray = createGenericColumnExtension(
  {
    type: "intArray",
    gqlType: "[Int]",
    gqlInputType: "[Int]",
    tsType: "number[]",
    tsInputType: "number[]",
    pgDataType: "integer[]"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    if (columnInfo.data_type === "ARRAY" && columnInfo.udt_name === "_int4") {
      return [];
    } else {
      throw new Error(`Cannot migrate type ${columnInfo.data_type} [${columnInfo.udt_name}] to intArray.`);
    }
  }
);

export const columnExtensionBigInt = createGenericColumnExtension(
  {
    type: "bigint",
    gqlType: "String",
    gqlInputType: "String",
    tsType: "string",
    tsInputType: "string",
    pgDataType: "bigint"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "bigint":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to bigint.`);
    }
  }
);

export const columnExtensionBigIntArray = createGenericColumnExtension(
  {
    type: "bigintArray",
    gqlType: "[String]",
    gqlInputType: "[String]",
    tsType: "string[]",
    tsInputType: "string[]",
    pgDataType: "bigint[]"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    if (columnInfo.data_type === "ARRAY" && columnInfo.udt_name === "_int8") {
      return [];
    } else {
      throw new Error(`Cannot migrate type ${columnInfo.data_type} [${columnInfo.udt_name}] to bigintArray.`);
    }
  }
);

export const columnExtensionFloat = createGenericColumnExtension(
  {
    type: "float",
    gqlType: "Float",
    gqlInputType: "Float",
    tsType: "number",
    tsInputType: "number",
    pgDataType: "double precision"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "double precision":
        return [];
      case "integer":
        return [`ALTER TABLE "${context.table.schema}"."${context.table.name}" ALTER COLUMN "${context.column.name}" TYPE double precision;`];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to double precision;.`);
    }
  }
);

export const columnExtensionBoolean = createGenericColumnExtension(
  {
    type: "boolean",
    gqlType: "Boolean",
    gqlInputType: "Boolean",
    tsType: "boolean",
    tsInputType: "boolean",
    pgDataType: "boolean"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "boolean":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to boolean;.`);
    }
  }
);

export const columnExtensionDateTimeUTC = createGenericColumnExtension(
  {
    type: "dateTimeUTC",
    gqlType: "String",
    gqlInputType: "String",
    tsType: "string",
    tsInputType: "string",
    pgDataType: "timestamp without time zone"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "timestamp without time zone":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to timestamp without time zone;.`);
    }
  }
);

export const columnExtensionJson = createGenericColumnExtension(
  {
    type: "json",
    gqlType: "JSON",
    gqlInputType: "JSON",
    tsType: "any",
    tsInputType: "any",
    pgDataType: "json"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "json":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to json.`);
    }
  }
);

export const columnExtensionJsonb = createGenericColumnExtension(
  {
    type: "jsonb",
    gqlType: "JSON",
    gqlInputType: "JSON",
    tsType: "any",
    tsInputType: "any",
    pgDataType: "jsonb"
  },
  (context: IColumnExtensionContext, columnInfo: IColumnInfo) => {
    switch (columnInfo.data_type) {
      case "jsonb":
        return [];
      default:
        throw new Error(`Cannot migrate type ${columnInfo.data_type} to json.`);
    }
  }
);
