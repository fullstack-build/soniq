import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import parseValue from "./parseValue";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IDefaultResolverMeta, IMutationViewMeta } from "../../RuntimeInterfaces";

export default function resolveUpdateMutation(
  defaultResolverMeta: IDefaultResolverMeta,
  query: IParsedResolveInfo<IMutationInputObject>,
  mutation: IMutationViewMeta,
  returnIdHandler: ReturnIdHandler
): IMutationBuildObject {
  const values: string[] = [];

  const fieldAssignments: string = Object.keys(query.args.input)
    .filter((fieldName) => fieldName !== "id")
    .map((fieldName, index) => {
      const value: unknown = query.args.input[fieldName];
      const finalValue: string | null = parseValue(value, returnIdHandler);

      if (finalValue != null) {
        values.push(finalValue);
      }
      return `"${fieldName}" = $${index + 1}`;
    })
    .join(", ");

  const entityId: string = returnIdHandler.getReturnId(query.args.input.id);
  values.push(entityId);

  return {
    sql: `UPDATE "${defaultResolverMeta.viewsSchemaName}"."${mutation.viewName}" SET ${fieldAssignments} WHERE id = $${values.length};`,
    values,
    mutation,
    id: entityId,
  };
}
