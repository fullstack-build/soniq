import { GraphQLResolveInfo } from "graphql";
import { IResolverMeta, IMutationViewMeta } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo, parseResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import resolveCreateMutation from "./resolveCreateMutation";
import resolveUpdateMutation from "./resolveUpdateMutation";
import resolveDeleteMutation from "./resolveDeleteMutation";
import { ReturnIdHandler } from "../../ReturnIdHandler";

export * from "./types";

export default class MutationBuilder {
  private resolverMeta: IResolverMeta;

  constructor(resolverMeta: IResolverMeta) {
    this.resolverMeta = resolverMeta;
  }

  public build(info: GraphQLResolveInfo, returnIdHandler: ReturnIdHandler): IMutationBuildObject {
    const query: IParsedResolveInfo<IMutationInputObject> = parseResolveInfo(info);

    const mutation: IMutationViewMeta = this.resolverMeta.mutation[query.name];

    switch (mutation.type) {
      case "CREATE":
        return resolveCreateMutation(query, mutation, returnIdHandler);
      case "UPDATE":
        return resolveUpdateMutation(query, mutation, returnIdHandler);
      case "DELETE":
        return resolveDeleteMutation(query, mutation, returnIdHandler);
      default:
        throw new Error(`Mutation-Type does not exist: ${mutation}`);
    }
  }
}
