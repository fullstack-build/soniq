import { IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import parseValue from "./parseValue";

export default function resolveCreateMutation(query: IParsedResolveInfo<IMutationInputObject>, mutation: IMutationViewMeta): IMutationBuildObject {
  const fieldNames = Object.keys(query.args.input)
    .map((name) => `"${name}"`)
    .join(", ");

  const values: string[] = [];
  const valuesString: string = Object.values(query.args.input)
    .map((value, index) => {
      values.push(parseValue(value));
      return `$${index + 1}`;
    })
    .join(", ");

  return {
    sql: `INSERT INTO "${mutation.viewSchemaName}"."${mutation.viewName}" (${fieldNames}) VALUES (${valuesString});`,
    values,
    mutation,
    id: query.args.input.id || null
  };
}
