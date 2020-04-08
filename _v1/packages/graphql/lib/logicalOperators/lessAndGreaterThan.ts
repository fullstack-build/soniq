import { ISingleValueOperator } from "./types";

const greaterThan: ISingleValueOperator = {
  name: "greaterThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} > ${value}`;
  }
};

const greaterThanOrEqual: ISingleValueOperator = {
  name: "greaterThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} >= ${value}`;
  }
};

const lessThan: ISingleValueOperator = {
  name: "lessThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} < ${value}`;
  }
};

const lessThanOrEqual: ISingleValueOperator = {
  name: "lessThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <= ${value}`;
  }
};

export { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
