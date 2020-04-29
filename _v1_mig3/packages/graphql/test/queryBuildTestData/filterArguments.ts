import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { IQueryClauseObject, IParsedResolveInfo, IQueryBuildOject } from "../../lib/getDefaultResolvers/types";
import { IQueryBuildTestData } from "./types";

const expectedQueryBuildObject: IQueryBuildOject = {
  sql: `SELECT (SELECT COALESCE(json_agg(row_to_json("_local_0_")), \'[]\'::json) FROM (SELECT "_local_1_"."id" "id", "_local_1_"."name" "name" FROM "_graphql"."DIRECTOR_READ_PUBLIC" AS "_local_1_" WHERE (("_local_1_"."id" IS NOT NULL) AND ("_local_1_"."name" IS NOT NULL)) AND (("_local_1_"."id" IS NOT NULL) AND ("_local_1_"."name" IS NOT NULL)) AND ("_local_1_"."id" = $1 AND "_local_1_"."id" IN ($2, $3)) ORDER BY "_local_1_"."id" ASC LIMIT $4 OFFSET $5) "_local_0_") "directors";`,
  values: ["blub", "bla", "foo", 5, 10],
  queryName: "directors",
  authRequired: false,
  potentialHighCost: false,
  costTree: null,
  maxDepth: 1
};

const query: IParsedResolveInfo<IQueryClauseObject> = {
  name: "directors",
  alias: "directors",
  args: {
    where: {
      OR: [
        {
          id: {
            is: "NOT_NULL"
          },
          name: {
            is: "NOT_NULL"
          }
        }
      ],
      AND: [
        {
          id: {
            is: "NOT_NULL"
          },
          name: {
            is: "NOT_NULL"
          }
        }
      ],
      id: {
        equals: "blub",
        in: ["bla", "foo"]
      }
    },
    orderBy: ["id_ASC"],
    limit: "5",
    offset: "10"
  },
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
