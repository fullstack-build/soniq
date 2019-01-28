import { IOperator } from "../../interfaces";

const like: IOperator = {
  name: "like",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text LIKE ${value}`;
  }
};

const notLike: IOperator = {
  name: "notLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT LIKE ${value}`;
  }
};

const iLike: IOperator = {
  name: "iLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ILIKE ${value}`;
  }
};

const notILike: IOperator = {
  name: "notILike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT ILIKE ${value}`;
  }
};

const similarTo: IOperator = {
  name: "similarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text SIMILAR TO ${value}`;
  }
};

const notSimilarTo: IOperator = {
  name: "notSimilarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT SIMILAR TO ${value}`;
  }
};

const posixMatchCaseSensitive: IOperator = {
  name: "posixMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~ ${value}`;
  }
};

const posixMatchCaseInsensitive: IOperator = {
  name: "posixMatchCaseInsensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~* ${value}`;
  }
};

const posixNoMatchCaseSensitive: IOperator = {
  name: "posixNoMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text !~ ${value}`;
  }
};

const posixNoMatchCaseInsensitive: IOperator = {
  name: "posixNoMatchCaseInsensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text !~* ${value}`;
  }
};

export {
  like,
  iLike,
  notLike,
  notILike,
  similarTo,
  notSimilarTo,
  posixMatchCaseSensitive,
  posixMatchCaseInsensitive,
  posixNoMatchCaseSensitive,
  posixNoMatchCaseInsensitive
};
