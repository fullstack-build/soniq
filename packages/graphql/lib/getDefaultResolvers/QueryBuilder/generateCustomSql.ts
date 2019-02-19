import { operatorsObject, IBooleanOperator, isMultiValueOperator } from "../../logicalOperators";
import { ICustoms, INestedFilter, IFilterLeaf } from "./types";

export default function generateCustomSql(
  hasMatch: boolean,
  customs: ICustoms,
  getParam: (value: number) => string,
  getField: (fieldName: string) => string
): string {
  function createOperator(operatorName: string, fieldName: string, value: number) {
    if (operatorsObject[operatorName] == null) {
      throw new Error(`Operator '${operatorName}' not found.`);
    }

    const operator = operatorsObject[operatorName];
    const context = {
      field: getField(fieldName),
      value: null,
      values: null
    };

    if ((operator as IBooleanOperator).unsafeValue === true) {
      if (Array.isArray(value)) {
        context.values = value;
      } else {
        context.value = value;
      }
    } else {
      if (Array.isArray(value)) {
        context.values = value.map(getParam);
      } else {
        context.value = getParam(value);
      }
    }

    const requiresArray = isMultiValueOperator(operator);

    if (requiresArray === true && context.values == null) {
      throw new Error(`Operator '${operatorName}' requires an array of values.`);
    }
    if (requiresArray !== true && context.value == null) {
      throw new Error(`Operator '${operatorName}' requires a single value.`);
    }

    return operator.getSql(context);
  }

  function createOperators(fieldName: string, field: IFilterLeaf) {
    return Object.entries(field)
      .map(([operatorName, value]) => createOperator(operatorName, fieldName, value))
      .join(" AND ");
  }

  function createAndList(filterList: INestedFilter[]) {
    return filterList.map(createFilter).join(" AND ");
  }

  function createOrList(filterList: INestedFilter[]) {
    return filterList.map(createFilter).join(" OR ");
  }

  function createFilter(filter: INestedFilter) {
    const sqlList: string[] = [];

    Object.entries(filter).forEach(([fieldName, field]) => {
      if (fieldName === "AND") {
        sqlList.push(`(${createAndList(field)})`);
      } else if (fieldName === "OR") {
        sqlList.push(`(${createOrList(field)})`);
      } else {
        sqlList.push(`(${createOperators(fieldName, field)})`);
      }
    });

    return sqlList.join(" AND ");
  }

  let sql = "";

  if (customs.where != null) {
    if (hasMatch === true) {
      sql += " AND ";
    } else {
      sql += " WHERE ";
    }
    sql += `(${createFilter(customs.where)})`;
  }

  if (customs.orderBy != null) {
    const orderBy = Array.isArray(customs.orderBy) ? customs.orderBy : [customs.orderBy];
    const orders = orderBy.map((option) => {
      const splitted = option.split("_");
      const order = splitted.pop();
      const fieldName = splitted.join("_");
      if (order !== "ASC" && order !== "DESC") {
        throw new Error(`OrderBy has an invalid value '${option}'.`);
      }
      return `${getField(fieldName)} ${order}`;
    });

    sql += ` ORDER BY ${orders.join(", ")}`;
  }

  if (customs.limit != null) {
    sql += ` LIMIT ${getParam(parseInt(customs.limit, 10))}`;
  }

  if (customs.offset != null) {
    sql += ` OFFSET ${getParam(parseInt(customs.offset, 10))}`;
  }

  return sql;
}
