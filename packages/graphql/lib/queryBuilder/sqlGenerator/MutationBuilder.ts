import { GraphQLResolveInfo } from "graphql";
import { IMutationBuild, IParsedResolveInfo, parseResolveInfo } from "./types";

export default class MutationBuilder {
  private resolverMeta: any;

  constructor(resolverMeta: any) {
    this.resolverMeta = resolverMeta;
  }

  private resolveCreateMutation(query: IParsedResolveInfo, mutation: any): IMutationBuild {
    const fieldNames = Object.keys(query.args.input);
    const fieldValues = Object.values(query.args.input);

    const values = [];

    // Generate fields which will be inserted
    const f = fieldNames
      .map((name) => {
        return `"${name}"`;
      })
      .join(", ");

    // Generate values to be inserted
    const v = fieldValues
      .map((value) => {
        let insertValue = value;
        if (insertValue != null && typeof insertValue === "object") {
          insertValue = JSON.stringify(insertValue);
        }
        values.push(insertValue);
        return `$${values.length}`;
      })
      .join(", ");

    // Build insert query
    return {
      sql: `INSERT INTO "${mutation.viewSchemaName}"."${mutation.viewName}" (${f}) VALUES (${v});`,
      values,
      mutation,
      id: query.args.input.id || null
    };
  }

  private resolveUpdateMutation(query: IParsedResolveInfo, mutation: any): IMutationBuild {
    const setFields = [];
    const values = [];
    let entityId = null;

    Object.keys(query.args.input).forEach((fieldName) => {
      const fieldValue = query.args.input[fieldName];
      if (fieldName !== "id") {
        // Add field to update set list and it's value to values

        let updateValue = fieldValue;
        if (updateValue != null && typeof updateValue === "object") {
          updateValue = JSON.stringify(updateValue);
        }
        values.push(updateValue);
        setFields.push(`"${fieldName}" = $${values.length}`);
      } else {
        // If field is id use it as entity identifier
        entityId = fieldValue;
      }
    });

    // add id to values to match it
    values.push(entityId);

    // Build update by id query
    return {
      sql: `UPDATE "${mutation.viewSchemaName}"."${mutation.viewName}" SET ${setFields.join(", ")} WHERE id = $${values.length};`,
      values,
      mutation,
      id: query.args.input.id
    };
  }

  private resolveDeleteMutation(query: IParsedResolveInfo, mutation: any): IMutationBuild {
    // Build delete by id query
    return {
      sql: `DELETE FROM "${mutation.viewSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
      values: [query.args.input.id],
      mutation,
      id: query.args.input.id
    };
  }

  public build(info: GraphQLResolveInfo) {
    const query: IParsedResolveInfo = parseResolveInfo(info);

    // Get mutation information from generated Schema-data
    const mutation = this.resolverMeta.mutation[query.name];

    switch (mutation.type) {
      case "CREATE":
        return this.resolveCreateMutation(query, mutation);
      case "UPDATE":
        return this.resolveUpdateMutation(query, mutation);
      case "DELETE":
        return this.resolveDeleteMutation(query, mutation);
      default:
        throw new Error(`Mutation-Type does not exist: ${mutation.type}`);
    }
  }
}
