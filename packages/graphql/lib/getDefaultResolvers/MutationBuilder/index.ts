import { GraphQLResolveInfo } from "graphql";
import { IResolverMeta, IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo, parseResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import resolveCreateMutation from "./resolveCreateMutation";
import resolveUpdateMutation from "./resolveUpdateMutation";
import resolveDeleteMutation from "./resolveDeleteMutation";

export * from "./types";

export default class MutationBuilder {
  private resolverMeta: IResolverMeta;

  constructor(resolverMeta: IResolverMeta) {
    this.resolverMeta = resolverMeta;
  }

  public build(info: GraphQLResolveInfo): IMutationBuildObject {
    const query: IParsedResolveInfo<IMutationInputObject> = parseResolveInfo(info);

    const mutation: IMutationViewMeta = this.resolverMeta.mutation[query.name];

    switch (mutation.type) {
      case "CREATE":
        return resolveCreateMutation(query, mutation);
      case "UPDATE":
        return resolveUpdateMutation(query, mutation);
      case "DELETE":
        return resolveDeleteMutation(query, mutation);
      default:
        throw new Error(`Mutation-Type does not exist: ${mutation}`);
    }
  }
}
