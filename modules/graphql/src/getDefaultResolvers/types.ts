import { GraphQLResolveInfo } from "graphql";
//@ts-ignore TODO: @eugene This package has no types.
import { parseResolveInfo as graphQlParseResolveInfo } from "graphql-parse-resolve-info";

export * from "./MutationBuilder/types";
export * from "./QueryBuilder/types";
export function parseResolveInfo<TArgs>(info: GraphQLResolveInfo): IParsedResolveInfo<TArgs> {
  return graphQlParseResolveInfo(info);
}

export interface IParsedResolveInfo<TArgs> {
  name: string;
  alias: string;
  args: TArgs;
  fieldsByTypeName: {
    [typeName: string]: {
      [fieldName: string]: IParsedResolveInfo<TArgs>;
    };
  };
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
