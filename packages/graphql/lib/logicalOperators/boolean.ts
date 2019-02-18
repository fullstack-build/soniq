import { IBooleanOperator } from "./types";

const operators = {
  NULL: "IS NULL",
  NOT_NULL: "IS NOT NULL",
  TRUE: "IS TRUE",
  NOT_TRUE: "IS NOT TRUE",
  FALSE: "IS FALSE",
  NOT_FALSE: "IS NOT FALSE",
  UNKNOWN: "IS UNKNOWN",
  NOT_UNKNOWN: "IS NOT UNKNOWN"
};

const schemaExtension = `
enum IS_VALUE {
  ${Object.keys(operators).join("\n")}
}
`;

const booleanOperator: IBooleanOperator = {
  name: "is",
  value: "IS_VALUE",
  schemaExtension,
  unsafeValue: true,
  getSql: (context) => {
    const { field, value } = context;
    if (operators[value] == null) {
      throw new Error(`Operator '${value}' not found for generating where clause 'in'.`);
    }
    return `${field} ${operators[value]}`;
  }
};

export { booleanOperator };
