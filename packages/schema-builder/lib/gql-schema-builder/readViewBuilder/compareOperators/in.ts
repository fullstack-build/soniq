import { IOperator } from "../../interfaces";

const inOperator: IOperator = {
  name: "in",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} IN (${values.join(", ")})`;
  }
};

const notInOperator: IOperator = {
  name: "notIn",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} NOT IN (${values.join(", ")})`;
  }
};

const includes: IOperator = {
  name: "includes",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const includesNot: IOperator = {
  name: "includesNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const contains: IOperator = {
  name: "contains",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} @> ARRAY[${values.join(", ")}]`;
  }
};

const isContainedBy: IOperator = {
  name: "isContainedBy",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} <@ ARRAY[${values.join(", ")}]`;
  }
};

export { inOperator, notInOperator, includes, includesNot, contains, isContainedBy };
