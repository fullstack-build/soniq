const greaterThan = {
  name: "greaterThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} > ${value}`;
  }
};

const greaterThanOrEqual = {
  name: "greaterThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} >= ${value}`;
  }
};

const lessThan = {
  name: "lessThan",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} < ${value}`;
  }
};

const lessThanOrEqual = {
  name: "lessThanOrEqual",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field} <= ${value}`;
  }
};

export { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
