import { IOperator } from "./types";

const like: IOperator = {
  name: "like",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text LIKE ${getParam(value)}`;
  },
};

const notLike: IOperator = {
  name: "notLike",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text NOT LIKE ${getParam(value)}`;
  },
};

const iLike: IOperator = {
  name: "iLike",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text ILIKE ${getParam(value)}`;
  },
};

const notILike: IOperator = {
  name: "notILike",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text NOT ILIKE ${getParam(value)}`;
  },
};

const similarTo: IOperator = {
  name: "similarTo",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text SIMILAR TO ${getParam(value)}`;
  },
};

const notSimilarTo: IOperator = {
  name: "notSimilarTo",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text NOT SIMILAR TO ${getParam(value)}`;
  },
};

const posixMatchCaseSensitive: IOperator = {
  name: "posixMatchCaseSensitive",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text ~ ${getParam(value)}`;
  },
};

const posixMatchCaseInsensitive: IOperator = {
  name: "posixMatchCaseInsensitive",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text ~* ${getParam(value)}`;
  },
};

const posixNoMatchCaseSensitive: IOperator = {
  name: "posixNoMatchCaseSensitive",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text !~ ${getParam(value)}`;
  },
};

const posixNoMatchCaseInsensitive: IOperator = {
  name: "posixNoMatchCaseInsensitive",
  gqlInputType: "String",
  getSql: (context) => {
    const { fieldPgSelector, value, getParam } = context;
    return `${fieldPgSelector}::text !~* ${getParam(value)}`;
  },
};

export {
  like,
  notLike,
  iLike,
  notILike,
  similarTo,
  notSimilarTo,
  posixMatchCaseSensitive,
  posixMatchCaseInsensitive,
  posixNoMatchCaseSensitive,
  posixNoMatchCaseInsensitive,
};
