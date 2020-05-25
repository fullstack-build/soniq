import { IOperator } from "./types";

const inOperator: IOperator = {
  name: "in",
  gqlInputType: "[String!]",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} IN (${value.map(getParam).join(", ")})`;
  }
};

const notIn: IOperator = {
  name: "notIn",
  gqlInputType: "[String!]",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} NOT IN (${value.map(getParam).join(", ")})`;
  }
};

const includes: IOperator = {
  name: "includes",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${getParam(value)} IN ${fieldPgSelector}`;
  }
};

const includesNot: IOperator = {
  name: "includesNot",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${getParam(value)} IN ${fieldPgSelector}`;
  }
};

const contains: IOperator = {
  name: "contains",
  gqlInputType: "[String!]",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} @> ARRAY[${value.map(getParam).join(", ")}]`;
  }
};

const isContainedBy: IOperator = {
  name: "isContainedBy",
  gqlInputType: "[String!]",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector} <@ ARRAY[${value.map(getParam).join(", ")}]`;
  }
};

export { inOperator as in, notIn, includes, includesNot, contains, isContainedBy };
