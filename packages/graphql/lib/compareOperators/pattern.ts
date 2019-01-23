import { ISingleValueOperator } from "./types";

const like: ISingleValueOperator = {
  name: "like",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text LIKE ${value}`;
  }
};

const notLike: ISingleValueOperator = {
  name: "notLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT LIKE ${value}`;
  }
};

const iLike: ISingleValueOperator = {
  name: "iLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ILIKE ${value}`;
  }
};

const notILike: ISingleValueOperator = {
  name: "notILike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT ILIKE ${value}`;
  }
};

const similarTo: ISingleValueOperator = {
  name: "similarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text SIMILAR TO ${value}`;
  }
};

const notSimilarTo: ISingleValueOperator = {
  name: "notSimilarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT SIMILAR TO ${value}`;
  }
};

const posixMatchCaseSensitive: ISingleValueOperator = {
  name: "posixMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~ ${value}`;
  }
};

const posixMatchCaseInsensitive: ISingleValueOperator = {
  name: "posixMatchCaseInsensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~* ${value}`;
  }
};

const posixNoMatchCaseSensitive: ISingleValueOperator = {
  name: "posixNoMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text !~ ${value}`;
  }
};

const posixNoMatchCaseInsensitive: ISingleValueOperator = {
  name: "posixNoMatchCaseInsensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text !~* ${value}`;
  }
};

export {
  like,
  notLike,
  similarTo,
  notSimilarTo,
  posixMatchCaseSensitive,
  posixMatchCaseInsensitive,
  posixNoMatchCaseSensitive,
  posixNoMatchCaseInsensitive
};
