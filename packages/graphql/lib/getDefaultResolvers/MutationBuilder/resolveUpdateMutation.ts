import { IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import parseValue from "./parseValue";

export default function resolveUpdateMutation(query: IParsedResolveInfo<IMutationInputObject>, mutation: IMutationViewMeta): IMutationBuildObject {
  const values: string[] = [];

  const fieldAssignments: string = Object.keys(query.args.input)
    .filter((fieldName) => fieldName !== "id")
    .map((fieldName, index) => {
      const value: any = query.args.input[fieldName];
      values.push(parseValue(value));
      return `"${fieldName}" = $${index + 1}`;
    })
    .join(", ");

  values.push(query.args.input.id);

  return {
    sql: `UPDATE "${mutation.viewSchemaName}"."${mutation.viewName}" SET ${fieldAssignments} WHERE id = $${values.length};`,
    values,
    mutation,
    id: query.args.input.id
  };
}
