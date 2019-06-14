import logger from "../logger";
import { TColumnOptions } from "../types";

export default function adjustEnum(columnOptions: TColumnOptions): void {
  if (columnOptions.enum != null && columnOptions.enumName != null) {
    if (columnOptions.type !== "enum" && columnOptions.type != null) {
      logger.warn(
        `orm.columnOptions.warning: for column '${columnOptions.name}' columnOptions.type '${
          columnOptions.type
        }' will be overwritten with 'enum' because columnOptions.enum and columnOptions.enumName are given.`
      );
    }

    if (columnOptions.gqlType !== columnOptions.enumName && columnOptions.gqlType != null) {
      logger.warn(
        `orm.columnOptions.warning: for column '${columnOptions.name}' columnOptions.gqlType '${columnOptions.gqlType}' will be overwritten with '${
          columnOptions.enumName
        }' because columnOptions.enum and columnOptions.enumName are given.`
      );
    }

    columnOptions.type = "enum";
    columnOptions.gqlType = columnOptions.enumName;
    columnOptions.enum = Object.entries(columnOptions.enum)
      .filter(([key, value]) => typeof value !== "number")
      .map(([key, value]) => value);
  }
}
