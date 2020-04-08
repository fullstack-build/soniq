import { IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import { ReturnIdHandler } from "../../ReturnIdHandler";

export default function resolveDeleteMutation(
  query: IParsedResolveInfo<IMutationInputObject>,
  mutation: IMutationViewMeta,
  returnIdHandler: ReturnIdHandler
): IMutationBuildObject {
  const entityId = returnIdHandler.getReturnId(query.args.input.id);
  return {
    sql: `DELETE FROM "${mutation.viewSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
    values: [entityId],
    mutation,
    id: entityId
  };
}
