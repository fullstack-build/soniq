import { IOperator } from "../../interfaces";

const equal: IOperator = {
  name: "equals",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} = ${value}`;
  }
};

const notEqual: IOperator = {
  name: "equalsNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <> ${value}`;
  }
};

const isDistinctFrom: IOperator = {
  name: "isDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS DISTINCT FROM ${value}`;
  }
};

const isNotDistinctFrom: IOperator = {
  name: "isNotDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS NOT DISTINCT FROM ${value}`;
  }
};

export { equal, notEqual, isDistinctFrom, isNotDistinctFrom };
