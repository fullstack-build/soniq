import { INestedFilter, IFilterLeaf } from "../types";
import {
  getOperator,
  IMultiValueOperatorContext,
  isSingleValueOperator,
  ISingleValueOperatorContext,
  isBooleanOperator,
  IBooleanOperatorContext
} from "../../../logicalOperators";

export default function getGenerateFilterFn(
  getParam: (value: number) => string,
  getField: (fieldName: string) => string
): (filter: INestedFilter) => string {
  function generateFilter(filter: INestedFilter): string {
    const sqlList: string[] = [];

    Object.entries(filter).forEach(([fieldName, field]) => {
      if (fieldName === "AND") {
        sqlList.push(`(${generateConjunktionFilter(field)})`);
      } else if (fieldName === "OR") {
        sqlList.push(`(${generateDisjunctionFilter(field)})`);
      } else {
        sqlList.push(`(${generateOperatorsFilter(fieldName, field)})`);
      }
    });

    return sqlList.join(" AND ");
  }

  return generateFilter;

  function generateConjunktionFilter(filterList: INestedFilter[]) {
    return filterList.map(generateFilter).join(" AND ");
  }

  function generateDisjunctionFilter(filterList: INestedFilter[]) {
    return filterList.map(generateFilter).join(" OR ");
  }

  function generateOperatorsFilter(fieldName: string, field: IFilterLeaf) {
    return Object.entries(field)
      .map(([operatorName, value]) => generateOperatorFilter(operatorName, fieldName, value))
      .join(" AND ");
  }

  function generateOperatorFilter(operatorName: string, fieldName: string, value: number[] | number | string) {
    const operator = getOperator(operatorName);
    if (operator == null) {
      throw new Error(`Operator '${operatorName}' not found.`);
    }

    if (isBooleanOperator(operator)) {
      if (Array.isArray(value) || typeof value !== "string") {
        throw new Error(`Operator '${operatorName}' requires a single value.`);
      }
      const context: IBooleanOperatorContext = {
        field: getField(fieldName),
        value
      };
      return operator.getSql(context);
    } else if (isSingleValueOperator(operator)) {
      if (Array.isArray(value) || typeof value !== "number") {
        throw new Error(`Operator '${operatorName}' requires a single value.`);
      }
      const context: ISingleValueOperatorContext = {
        field: getField(fieldName),
        value: getParam(value)
      };

      return operator.getSql(context);
    } else {
      if (!Array.isArray(value)) {
        throw new Error(`Operator '${operatorName}' requires an array of values.`);
      }
      const context: IMultiValueOperatorContext = {
        field: getField(fieldName),
        values: value.map(getParam)
      };

      return operator.getSql(context);
    }
  }
}
