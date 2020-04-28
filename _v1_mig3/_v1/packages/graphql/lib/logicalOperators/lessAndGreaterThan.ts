import { IOperator } from "./types";

const greaterThan: IOperator = {
  name: "greaterThan",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} > ${getParam(value)}`;
  }
};

const greaterThanOrEqual: IOperator = {
  name: "greaterThanOrEqual",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} >= ${getParam(value)}`;
  }
};

const lessThan: IOperator = {
  name: "lessThan",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} < ${getParam(value)}`;
  }
};

const lessThanOrEqual: IOperator = {
  name: "lessThanOrEqual",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} <= ${getParam(value)}`;
  }
};

export { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
