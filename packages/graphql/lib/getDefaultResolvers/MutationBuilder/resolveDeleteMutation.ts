import { IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";

export default function resolveDeleteMutation(query: IParsedResolveInfo<IMutationInputObject>, mutation: IMutationViewMeta): IMutationBuildObject {
  return {
    sql: `DELETE FROM "${mutation.viewSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
    values: [query.args.input.id],
    mutation,
    id: query.args.input.id
  };
}
