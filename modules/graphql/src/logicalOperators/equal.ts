import { IOperator } from "./types";

const equals: IOperator = {
  name: "equals",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} = ${getParam(value)}`;
  },
};

const equalsNot: IOperator = {
  name: "equalsNot",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} <> ${getParam(value)}`;
  },
};

const isDistinctFrom: IOperator = {
  name: "isDistinctFrom",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} IS DISTINCT FROM ${getParam(value)}`;
  },
};

const isNotDistinctFrom: IOperator = {
  name: "isNotDistinctFrom",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} IS NOT DISTINCT FROM ${getParam(value)}`;
  },
};

export { equals, equalsNot, isDistinctFrom, isNotDistinctFrom };
