import { IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import parseValue from "./parseValue";
import { ReturnIdHandler } from "../../ReturnIdHandler";

export default function resolveUpdateMutation(
  query: IParsedResolveInfo<IMutationInputObject>,
  mutation: IMutationViewMeta,
  returnIdHandler: ReturnIdHandler
): IMutationBuildObject {
  const values: string[] = [];

  const fieldAssignments: string = Object.keys(query.args.input)
    .filter((fieldName) => fieldName !== "id")
    .map((fieldName, index) => {
      const value: any = query.args.input[fieldName];
      values.push(parseValue(value, returnIdHandler));
      return `"${fieldName}" = $${index + 1}`;
    })
    .join(", ");

  const entityId = returnIdHandler.getReturnId(query.args.input.id);
  values.push(entityId);

  return {
    sql: `UPDATE "${mutation.viewSchemaName}"."${mutation.viewName}" SET ${fieldAssignments} WHERE id = $${values.length};`,
    values,
    mutation,
    id: entityId
  };
}
