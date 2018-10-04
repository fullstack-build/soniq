const equal = {
  name: "equals",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} = ${value}`;
  }
};

const notEqual = {
  name: "equalsNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <> ${value}`;
  }
};

const isDistinctFrom = {
  name: "isDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS DISTINCT FROM ${value}`;
  }
};

const isNotDistinctFrom = {
  name: "isNotDistinctFrom",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} IS NOT DISTINCT FROM ${value}`;
  }
};

export { equal, notEqual, isDistinctFrom, isNotDistinctFrom };
