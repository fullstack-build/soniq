const inOperator = {
  name: "in",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} IN (${values.join(", ")})`;
  }
};

const notInOperator = {
  name: "notIn",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} NOT IN (${values.join(", ")})`;
  }
};

const includes = {
  name: "includes",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const includesNot = {
  name: "includesNot",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${value} IN ${field}`;
  }
};

const contains = {
  name: "contains",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} @> ARRAY[${values.join(", ")}]`;
  }
};

const isContainedBy = {
  name: "isContainedBy",
  value: "[String!]",
  getSql: (context) => {
    const { field, values } = context;
    return `${field} <@ ARRAY[${values.join(", ")}]`;
  }
};

export { inOperator, notInOperator, includes, includesNot, contains, isContainedBy };
