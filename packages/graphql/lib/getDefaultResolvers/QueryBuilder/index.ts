import { GraphQLResolveInfo } from "graphql";

import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";

import { IParsedResolveInfo, parseResolveInfo, IMatch } from "../types";
import { IQueryBuildOject, IQueryClauseObject } from "./types";
import QueryBuild from "./QueryBuild";

export * from "./types";

export default class QueryBuilder {
  private resolverMeta: IResolverMeta;
  private dbMeta: IDbMeta;
  private minQueryDepthToCheckCostLimit: number;

  constructor(resolverMeta: IResolverMeta, dbMeta: IDbMeta, minQueryDepthToCheckCostLimit: number) {
    this.resolverMeta = resolverMeta;
    this.dbMeta = dbMeta;
    this.minQueryDepthToCheckCostLimit = minQueryDepthToCheckCostLimit;
  }

  public build(info: GraphQLResolveInfo, isAuthenticated: boolean, match: IMatch = null): IQueryBuildOject {
    const query: IParsedResolveInfo<IQueryClauseObject> = parseResolveInfo(info);

    const selectQueryBuild = new QueryBuild(this.resolverMeta, this.dbMeta, isAuthenticated, this.minQueryDepthToCheckCostLimit, query, match);
    return selectQueryBuild.getBuildObject();
  }
}
