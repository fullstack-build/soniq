import { IOperator } from "./types";
import { UserInputError } from "../GraphqlErrors";

interface IOperators {
  [key: string]: string;
}

const operators: IOperators = {
  NULL: "IS NULL",
  NOT_NULL: "IS NOT NULL",
  TRUE: "IS TRUE",
  NOT_TRUE: "IS NOT TRUE",
  FALSE: "IS FALSE",
  NOT_FALSE: "IS NOT FALSE",
  UNKNOWN: "IS UNKNOWN",
  NOT_UNKNOWN: "IS NOT UNKNOWN",
};

const typeDefs: string = `
enum IS_VALUE {
  ${Object.keys(operators).join("\n")}
}
`;

const is: IOperator = {
  name: "is",
  gqlInputType: "IS_VALUE",
  typeDefs,
  getSql: (context) => {
    const { fieldPgSelector, value } = context;
    if (operators[value] == null) {
      throw new UserInputError(`Operator '${value}' not found for generating where clause 'in'.`, {
        exposeDetails: true,
      });
    }
    return `${fieldPgSelector} ${operators[value]}`;
  },
};

export { is };
