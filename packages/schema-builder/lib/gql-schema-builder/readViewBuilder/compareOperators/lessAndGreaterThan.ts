import { IOperator } from "../../interfaces";

const greaterThan: IOperator = {
  name: "greaterThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} > ${value}`;
  }
};

const greaterThanOrEqual: IOperator = {
  name: "greaterThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} >= ${value}`;
  }
};

const lessThan: IOperator = {
  name: "lessThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} < ${value}`;
  }
};

const lessThanOrEqual: IOperator = {
  name: "lessThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <= ${value}`;
  }
};

export { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
