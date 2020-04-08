import { ISingleValueOperator, IMultiValueOperator } from "./types";

const inOperator: IMultiValueOperator = {
  name: "in",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} IN (${values.join(", ")})`;
  }
};

const notInOperator: IMultiValueOperator = {
  name: "notIn",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} NOT IN (${values.join(", ")})`;
  }
};

const includes: ISingleValueOperator = {
  name: "includes",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const includesNot: ISingleValueOperator = {
  name: "includesNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const contains: IMultiValueOperator = {
  name: "contains",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} @> ARRAY[${values.join(", ")}]`;
  }
};

const isContainedBy: IMultiValueOperator = {
  name: "isContainedBy",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} <@ ARRAY[${values.join(", ")}]`;
  }
};

export { inOperator, notInOperator, includes, includesNot, contains, isContainedBy };
