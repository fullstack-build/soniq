import { GraphQLResolveInfo } from "graphql";
import { IResolverMeta, IDbMeta } from "@fullstack-one/schema-builder";
import { IQueryBuild, IMutationBuild } from "./sqlGenerator/types";

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
