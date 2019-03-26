import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { IQueryClauseObject, IParsedResolveInfo, IQueryBuildOject } from "../../lib/getDefaultResolvers/types";
import { IQueryBuildTestData } from "./types";

const expectedQueryBuildObject: IQueryBuildOject = {
  sql: `SELECT (SELECT COALESCE(json_agg(row_to_json("_local_0_")), '[]'::json) FROM (SELECT "_local_1_"."id" "id", (SELECT row_to_json("_local_2_") FROM (SELECT "_local_3_"."id" "id" FROM "_graphql"."DIRECTOR_READ_PUBLIC" AS "_local_3_" WHERE "_local_3_"."id" = "_local_1_"."directorId") "_local_2_") "director" FROM "_graphql"."MOVIE_READ_PUBLIC" AS "_local_1_") "_local_0_") "movies";`,
  values: [],
  queryName: "movies",
  authRequired: false,
  potentialHighCost: false,
  costTree: null,
  maxDepth: 1
};

const query: IParsedResolveInfo<IQueryClauseObject> = {
  name: "movies",
  alias: "movies",
  args: {},
  fieldsByTypeName: {
    Movie: {
      id: {
        name: "id",
        alias: "id",
        args: {},
        fieldsByTypeName: {}
      },
      director: {
        name: "director",
        alias: "director",
        args: {},
        fieldsByTypeName: {
          Director: {
            id: {
              name: "id",
              alias: "id",
              args: {},
              fieldsByTypeName: {}
            }
          }
        }
      }
    }
  }
};

const dbMeta: IDbMeta = {
  version: 1,
  relations: {
    DirectorMovie: {
      "public.Movie": {
        name: "DirectorMovie",
        type: "ONE",
        schemaName: "public",
        tableName: "Movie",
        columnName: "directorId",
        virtualColumnName: "director",
        reference: {
          schemaName: "public",
          tableName: "Director",
          columnName: "id"
        }
      },
      "public.Director": {
        name: "DirectorMovie",
        type: "MANY",
        schemaName: "public",
        tableName: "Director",
        columnName: null,
        virtualColumnName: "movies",
        reference: {
          schemaName: "public",
          tableName: "Movie",
          columnName: null
        }
      }
    }
  }
};

const resolverMeta: IResolverMeta = {
  query: {
    Director: {
      viewSchemaName: "_graphql",
      publicViewName: "DIRECTOR_READ_PUBLIC",
      authViewName: "DIRECTOR_READ_AUTH",
      tableName: "Director",
      tableSchemaName: "public",
      publicFieldNames: ["id", "movies"],
      authFieldNames: [],
      fields: {
        id: {
          gqlFieldName: "id",
          nativeFieldName: "id",
          isVirtual: false
        },
        movies: {
          gqlFieldName: "movies",
          nativeFieldName: null,
          isVirtual: false,
          meta: {
            foreignGqlTypeName: "Movie",
            isListType: true,
            isNonNullType: true,
            relationName: "DirectorMovie",
            table: {
              gqlTypeName: "Director",
              schemaName: "public",
              tableName: "Director"
            }
          }
        }
      }
    },
    Movie: {
      viewSchemaName: "_graphql",
      publicViewName: "MOVIE_READ_PUBLIC",
      authViewName: "MOVIE_READ_AUTH",
      tableName: "Movie",
      tableSchemaName: "public",
      publicFieldNames: ["id", "director"],
      authFieldNames: [],
      fields: {
        id: {
          gqlFieldName: "id",
          nativeFieldName: "id",
          isVirtual: false
        },
        director: {
          gqlFieldName: "director",
          nativeFieldName: "directorId",
          isVirtual: false,
          meta: {
            foreignGqlTypeName: "Director",
            isListType: false,
            isNonNullType: true,
            relationName: "DirectorMovie",
            table: {
              gqlTypeName: "Movie",
              schemaName: "public",
              tableName: "Movie"
            }
          }
        }
      }
    }
  },
  mutation: {},
  permissionMeta: {}
};

const data: IQueryBuildTestData = {
  expected: expectedQueryBuildObject,
  query,
  dbMeta,
  resolverMeta
};

export default data;
