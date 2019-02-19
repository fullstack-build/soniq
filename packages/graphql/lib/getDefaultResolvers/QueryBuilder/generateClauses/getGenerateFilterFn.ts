import { INestedFilter, IFilterLeaf } from "../types";
import { operatorsObject, isMultiValueOperator, IBooleanOperator } from "../../../logicalOperators";

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

  function generateOperatorFilter(operatorName: string, fieldName: string, value: number) {
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
}
