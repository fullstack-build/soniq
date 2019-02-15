import { IOperatorObject, isBooleanOperator } from "../types";

export default function getOperatorsSchemaExtension(operatorsObject: IOperatorObject): string {
  return Object.values(operatorsObject)
    .map((operator) => {
      if (isBooleanOperator(operator)) {
        return `${operator.schemaExtension}\n`;
      }
      return "";
    })
    .join("");
}
