export = [
  {
    name: "Anyone",
    type: "expression",
    gqlReturnType: "Boolean",
    generate: (context, params): string => {
      return `TRUE`;
    }
  },
  {
    name: "GetTrue",
    type: "expression",
    gqlReturnType: "Boolean",
    generate: (context, params) => {
      return `true`;
    }
  },
  {
    name: "GetNumber",
    type: "expression",
    gqlReturnType: "Int",
    generate: (context, params) => {
      return `1`;
    }
  }
];
