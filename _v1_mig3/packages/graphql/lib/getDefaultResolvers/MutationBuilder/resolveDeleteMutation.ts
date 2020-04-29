import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IMutationViewMeta, IDefaultResolverMeta } from "../../RuntimeInterfaces";

export default function resolveDeleteMutation(
  defaultResolverMeta: IDefaultResolverMeta,
  query: IParsedResolveInfo<IMutationInputObject>,
  mutation: IMutationViewMeta,
  returnIdHandler: ReturnIdHandler
): IMutationBuildObject {
  const entityId = returnIdHandler.getReturnId(query.args.input.id);
  return {
    sql: `DELETE FROM "${defaultResolverMeta.viewsSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
    values: [entityId],
    mutation,
    id: entityId
  };
}
