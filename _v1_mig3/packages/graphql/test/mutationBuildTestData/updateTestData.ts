import { IMutationBuildObject, IParsedResolveInfo, IMutationInputObject } from "../../lib/getDefaultResolvers/types";
import { IUpdateViewMeta } from "@fullstack-one/schema-builder";
import { IMutationBuildTestData } from "./types";

const query: IParsedResolveInfo<IMutationInputObject> = {
  name: "MOVIE_UPDATE_ME",
  alias: "MOVIE_UPDATE_ME",
  args: {
    input: {
      id: "movie1",
      title: "Pulp Fiction",
      author: "Quentin Tarantino"
    }
  },
  fieldsByTypeName: {}
};

const mutation: IUpdateViewMeta = {
  name: "MOVIE_CREATE_ME",
  viewSchemaName: "_graphql",
  viewName: "MOVIE_UPDATE_ME",
  type: "UPDATE",
  requiresAuth: false,
  gqlTypeName: "Movie",
  gqlReturnTypeName: "Movie",
  extensions: {},
  gqlInputTypeName: "MOVIE_UPDATE_ME"
};

const expected: IMutationBuildObject = {
  sql: `UPDATE "_graphql"."MOVIE_UPDATE_ME" SET "title" = $1, "author" = $2 WHERE id = $3;`,
  values: ["Pulp Fiction", "Quentin Tarantino", "movie1"],
  mutation,
  id: "movie1"
};

const data: IMutationBuildTestData = { query, mutation, expected };

export default data;
