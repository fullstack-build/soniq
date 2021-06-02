import { IMutationBuildObject } from "./types";
import parseValue from "./parseValue";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IDefaultResolverMeta, IMutationViewMeta } from "../../moduleDefinition/RuntimeInterfaces";
import { ResolveTree } from "graphql-parse-resolve-info";

export default function resolveUpdateMutation(
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
  const values: string[] = [];

  const fieldAssignments: string = Object.keys(input)
    .filter((fieldName) => fieldName !== "id")
    .map((fieldName, index) => {
      const value: unknown = input[fieldName];
      const finalValue: string | null = parseValue(value, returnIdHandler);

      if (finalValue != null) {
        values.push(finalValue);
      }
      return `"${fieldName}" = $${index + 1}`;
    })
    .join(", ");

  const entityId: string = returnIdHandler.getReturnId(input.id);
  values.push(entityId);

  return {
    sql: `UPDATE "${defaultResolverMeta.viewsSchemaName}"."${mutation.viewName}" SET ${fieldAssignments} WHERE id = $${values.length};`,
    values,
    mutation,
    id: entityId,
  };
}
