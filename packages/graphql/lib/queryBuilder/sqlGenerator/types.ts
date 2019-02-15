import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo as graphQlParseResolveInfo } from "graphql-parse-resolve-info";

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

export interface IQueryBuild {
  sql: string;
  values: any[];
  query: {
    name: string;
  };
  authRequired: boolean;
  potentialHighCost: boolean;
  costTree: any;
  maxDepth: number;
}

export interface IMutationBuild {
  sql: string;
  values: any[];
  mutation: any;
  id: any;
}
