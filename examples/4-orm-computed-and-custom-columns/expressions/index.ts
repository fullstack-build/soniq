import { defineExpression } from "@fullstack-one/schema-builder";

export const anyone = defineExpression({
  name: "Anyone",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `TRUE`;
  }
});

export const getTrue = defineExpression({
  name: "GetTrue",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params) => {
    return `true`;
  }
});

export const getNumber = defineExpression({
  name: "GetNumber",
  type: "expression",
  gqlReturnType: "Int",
  generate: (context, params) => {
    return `1`;
  }
});

export const myId = defineExpression({
  name: "MyId",
  type: "expression",
  gqlReturnType: "ID",
  generate: (context): string => {
    return `${context.getField("id")}`;
  }
});
