import { IMutationBuildObject } from "./types";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IMutationViewMeta, IDefaultResolverMeta } from "../../RuntimeInterfaces";
import { ResolveTree } from "graphql-parse-resolve-info";

export default function resolveDeleteMutation(
  defaultResolverMeta: IDefaultResolverMeta,
  query: ResolveTree,
  mutation: IMutationViewMeta,
  returnIdHandler: ReturnIdHandler
): IMutationBuildObject {
  if (query.args.input == null) {
    throw new Error("Invalid input.");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any = query.args.input;
  if (input.id == null) {
    throw new Error("Invalid input. Missing id.");
  }
  const entityId: string = returnIdHandler.getReturnId(input.id);
  return {
    sql: `DELETE FROM "${defaultResolverMeta.viewsSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
    values: [entityId],
    mutation,
    id: entityId,
  };
}
