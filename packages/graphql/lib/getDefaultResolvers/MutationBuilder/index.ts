// tslint:disable:member-ordering
import { GraphQLResolveInfo } from "graphql";
import { IResolverMeta, IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo, parseResolveInfo } from "../types";
import { IMutationBuild } from "./types";

export * from "./types";

export default class MutationBuilder {
  private resolverMeta: IResolverMeta;

  constructor(resolverMeta: IResolverMeta) {
    this.resolverMeta = resolverMeta;
  }

  public build(info: GraphQLResolveInfo): IMutationBuild {
    const query: IParsedResolveInfo = parseResolveInfo(info);

    const mutation: IMutationViewMeta = this.resolverMeta.mutation[query.name];

    switch (mutation.type) {
      case "CREATE":
        return this.resolveCreateMutation(query, mutation);
      case "UPDATE":
        return this.resolveUpdateMutation(query, mutation);
      case "DELETE":
        return this.resolveDeleteMutation(query, mutation);
      default:
        throw new Error(`Mutation-Type does not exist: ${mutation}`);
    }
  }

  private resolveCreateMutation(query: IParsedResolveInfo, mutation: IMutationViewMeta): IMutationBuild {
    const fieldNames = Object.keys(query.args.input)
      .map((name) => `"${name}"`)
      .join(", ");

    const values: string[] = [];
    const valuesString: string = Object.values(query.args.input)
      .map((value, index) => {
        values.push(this.parseValue(value));
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

  private resolveUpdateMutation(query: IParsedResolveInfo, mutation: IMutationViewMeta): IMutationBuild {
    const values: string[] = [];

    const fieldAssignments: string = Object.keys(query.args.input)
      .filter((fieldName) => fieldName !== "id")
      .map((fieldName, index) => {
        const value: any = query.args.input[fieldName];
        values.push(this.parseValue(value));
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

  private resolveDeleteMutation(query: IParsedResolveInfo, mutation: IMutationViewMeta): IMutationBuild {
    return {
      sql: `DELETE FROM "${mutation.viewSchemaName}"."${mutation.viewName}" WHERE id = $1;`,
      values: [query.args.input.id],
      mutation,
      id: query.args.input.id
    };
  }

  private parseValue(value: any): string {
    if (value != null && typeof value === "object") return JSON.stringify(value);
    return `${value}`;
  }
}
