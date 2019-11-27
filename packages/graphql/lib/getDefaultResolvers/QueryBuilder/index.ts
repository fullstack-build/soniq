import { GraphQLResolveInfo } from "graphql";

import { IParsedResolveInfo, parseResolveInfo, IMatch } from "../types";
import { IQueryBuildOject, IQueryClauseObject } from "./types";
import QueryBuild from "./QueryBuild";
import { IDefaultResolverMeta } from "../../RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";

export * from "./types";

export default class QueryBuilder {
  private operatorsBuilder: OperatorsBuilder;
  private defaultResolverMeta: IDefaultResolverMeta;

  constructor(operatorsBuilder: OperatorsBuilder, defaultResolverMeta: IDefaultResolverMeta) {
    this.operatorsBuilder = operatorsBuilder;
    this.defaultResolverMeta = defaultResolverMeta;
  }

  public build(info: GraphQLResolveInfo, isAuthenticated: boolean, match: IMatch = null): IQueryBuildOject {
    const query: IParsedResolveInfo<IQueryClauseObject> = parseResolveInfo(info);

    const selectQueryBuild = new QueryBuild(this.operatorsBuilder, this.defaultResolverMeta, isAuthenticated, query, match);
    return selectQueryBuild.getBuildObject();
  }

  public getCostLimit(): number {
    return this.defaultResolverMeta.costLimit;
  }
}
