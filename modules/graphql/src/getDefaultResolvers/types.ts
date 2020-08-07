import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo as graphQlParseResolveInfo, ResolveTree, FieldsByTypeName } from "graphql-parse-resolve-info";

export * from "./MutationBuilder/types";
export * from "./QueryBuilder/types";
export function parseResolveInfo<TArgs>(info: GraphQLResolveInfo): ResolveTree {
  const result: ResolveTree | FieldsByTypeName | null | void = graphQlParseResolveInfo(info);

  if (result != null && result.name != null) {
    return result as ResolveTree;
  } else {
    throw new Error("Invalid query.");
  }
}

export interface IDefaultMutationResolverContext {
  accessToken: string | null;
  ctx: {
    state: {
      includesMutation: boolean;
    };
  };
}

export interface IMatch {
  ownColumnExpression: string;
  foreignColumnName: string;
}
