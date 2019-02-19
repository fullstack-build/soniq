import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo as graphQlParseResolveInfo } from "graphql-parse-resolve-info";

export * from "./MutationBuilder/types";
export * from "./QueryBuilder/types";
export const parseResolveInfo: (info: GraphQLResolveInfo) => IParsedResolveInfo = graphQlParseResolveInfo;

export interface IParsedResolveInfo {
  name: string;
  alias: string;
  args: any;
  fieldsByTypeName: {
    [typeName: string]: {
      [fieldName: string]: IParsedResolveInfo;
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
  type: "SIMPLE" | "ARRAY";
  foreignFieldName: string;
  fieldExpression: string;
}
