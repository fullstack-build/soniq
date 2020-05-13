import { GraphQLResolveInfo } from "graphql";

import { IParsedResolveInfo, parseResolveInfo, IMatch } from "../types";
import { IQueryBuildObject, IQueryClauseObject } from "./types";
import QueryBuild from "./QueryBuild";
import { IDefaultResolverMeta } from "../../RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";

export * from "./types";

export default class QueryBuilder {
  private _operatorsBuilder: OperatorsBuilder;
  private _defaultResolverMeta: IDefaultResolverMeta;

  public constructor(operatorsBuilder: OperatorsBuilder, defaultResolverMeta: IDefaultResolverMeta) {
    this._operatorsBuilder = operatorsBuilder;
    this._defaultResolverMeta = defaultResolverMeta;
  }

  public build(
    info: GraphQLResolveInfo,
    isAuthenticated: boolean,
    useRootViews: boolean = false,
    match: IMatch | null = null
  ): IQueryBuildObject {
    const query: IParsedResolveInfo<IQueryClauseObject> = parseResolveInfo(info);

    const selectQueryBuild: QueryBuild = new QueryBuild(
      this._operatorsBuilder,
      this._defaultResolverMeta,
      isAuthenticated,
      useRootViews,
      query,
      match
    );
    return selectQueryBuild.getBuildObject();
  }

  public getCostLimit(): number {
    return this._defaultResolverMeta.costLimit;
  }
}
