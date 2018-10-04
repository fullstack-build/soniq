const like = {
  name: "like",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text LIKE ${value}`;
  }
};

const notLike = {
  name: "notLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT LIKE ${value}`;
  }
};

const iLike = {
  name: "iLike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ILIKE ${value}`;
  }
};

const notILike = {
  name: "notILike",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT ILIKE ${value}`;
  }
};

const similarTo = {
  name: "similarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text SIMILAR TO ${value}`;
  }
};

const notSimilarTo = {
  name: "notSimilarTo",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text NOT SIMILAR TO ${value}`;
  }
};

const posixMatchCaseSensitive = {
  name: "posixMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~ ${value}`;
  }
};

const posixMatchCaseInsensitive = {
  name: "posixMatchCaseInsensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text ~* ${value}`;
  }
};

const posixNoMatchCaseSensitive = {
  name: "posixNoMatchCaseSensitive",
  value: "String",
  getSql: (context) => {
    const { field, value } = context;
    return `${field}::text !~ ${value}`;
  }
};

const posixNoMatchCaseInsensitive = {
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
