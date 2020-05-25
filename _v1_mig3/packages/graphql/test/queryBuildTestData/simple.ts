import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { IQueryClauseObject, IParsedResolveInfo, IQueryBuildOject } from "../../lib/getDefaultResolvers/types";
import { IQueryBuildTestData } from "./types";

const expectedQueryBuildObject: IQueryBuildOject = {
  sql: `SELECT (SELECT COALESCE(json_agg(row_to_json("_local_0_")), \'[]\'::json) FROM (SELECT "_local_1_"."id" "id", "_local_1_"."name" "name" FROM "_graphql"."DIRECTOR_READ_PUBLIC" AS "_local_1_") "_local_0_") "directors";`,
  values: [],
  queryName: "directors",
  authRequired: false,
  potentialHighCost: false,
  costTree: null,
  maxDepth: 1
};

const query: IParsedResolveInfo<IQueryClauseObject> = {
  name: "directors",
  alias: "directors",
  args: {},
  fieldsByTypeName: {
    Director: {
      id: {
        name: "id",
        alias: "id",
        args: {},
        fieldsByTypeName: {}
      },
      name: {
        name: "name",
        alias: "name",
        args: {},
        fieldsByTypeName: {}
      }
    }
  }
};

const dbMeta: IDbMeta = {
  version: 1
};

const resolverMeta: IResolverMeta = {
  query: {
    Director: {
      viewSchemaName: "_graphql",
      publicViewName: "DIRECTOR_READ_PUBLIC",
      authViewName: "DIRECTOR_READ_AUTH",
      tableName: "Director",
      tableSchemaName: "public",
      publicFieldNames: ["id", "name"],
      authFieldNames: [],
      fields: {
        id: {
          gqlFieldName: "id",
          nativeFieldName: "id",
          isVirtual: false
        },
        name: {
          gqlFieldName: "name",
          nativeFieldName: "name",
          isVirtual: false
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
