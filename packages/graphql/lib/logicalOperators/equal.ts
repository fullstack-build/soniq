import { ISingleValueOperator } from "./types";

const equal: ISingleValueOperator = {
  name: "equals",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} = ${value}`;
  }
};

const notEqual: ISingleValueOperator = {
  name: "equalsNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <> ${value}`;
  }
};

const isDistinctFrom: ISingleValueOperator = {
  name: "isDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS DISTINCT FROM ${value}`;
  }
};

const isNotDistinctFrom: ISingleValueOperator = {
  name: "isNotDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS NOT DISTINCT FROM ${value}`;
  }
};

export { equal, notEqual, isDistinctFrom, isNotDistinctFrom };
