import { IMutationBuildObject } from "./types";
import parseValue from "./parseValue";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IMutationViewMeta, IDefaultResolverMeta } from "../../RuntimeInterfaces";
import { ResolveTree } from "graphql-parse-resolve-info";

export default function resolveCreateMutation(
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
  const fieldNames: string = Object.keys(input)
    .map((name) => `"${name}"`)
    .join(", ");

  const values: string[] = [];
  const valuesString: string = Object.values(input)
    .map((value, index) => {
      const finalValue: string | null = parseValue(value, returnIdHandler);

      if (finalValue != null) {
        values.push(finalValue);
      }
      return `$${index + 1}`;
    })
    .join(", ");

  return {
    sql: `INSERT INTO "${defaultResolverMeta.viewsSchemaName}"."${mutation.viewName}" (${fieldNames}) VALUES (${valuesString});`,
    values,
    mutation,
    id: returnIdHandler.getReturnId(input.id || null),
  };
}
