import { IBooleanOperator } from "./types";
import { UserInputError } from "..";

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

const is: IBooleanOperator = {
  name: "is",
  value: "IS_VALUE",
  schemaExtension,
  isBooleanOperator: true,
  getSql: (context) => {
    const { field, value } = context;
    if (operators[value] == null) {
      const error = new UserInputError(`Operator '${value}' not found for generating where clause 'in'.`);
      error.extensions.exposeDetails = true;
      throw error;
    }
    return `${field} ${operators[value]}`;
  }
};

export { is };
