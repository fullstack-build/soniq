import { GraphQLResolveInfo } from "graphql";
import { IParsedResolveInfo, parseResolveInfo } from "../types";
import { IMutationBuildObject, IMutationInputObject } from "./types";
import resolveCreateMutation from "./resolveCreateMutation";
import resolveUpdateMutation from "./resolveUpdateMutation";
import resolveDeleteMutation from "./resolveDeleteMutation";
import { ReturnIdHandler } from "../../resolverTransactions/ReturnIdHandler";
import { IDefaultResolverMeta, IMutationViewMeta } from "../../RuntimeInterfaces";

export * from "./types";

export default class MutationBuilder {
  private _defaultResolverMeta: IDefaultResolverMeta;

  public constructor(defaultResolverMeta: IDefaultResolverMeta) {
    this._defaultResolverMeta = defaultResolverMeta;
  }

  public build(info: GraphQLResolveInfo, returnIdHandler: ReturnIdHandler): IMutationBuildObject {
    const query: IParsedResolveInfo<IMutationInputObject> = parseResolveInfo(info);

    const mutation: IMutationViewMeta = this._defaultResolverMeta.mutation[query.name];

    switch (mutation.type) {
      case "CREATE":
        return resolveCreateMutation(this._defaultResolverMeta, query, mutation, returnIdHandler);
      case "UPDATE":
        return resolveUpdateMutation(this._defaultResolverMeta, query, mutation, returnIdHandler);
      case "DELETE":
        return resolveDeleteMutation(this._defaultResolverMeta, query, mutation, returnIdHandler);
      default:
        throw new Error(`Mutation-Type does not exist: ${mutation}`);
    }
  }
}
