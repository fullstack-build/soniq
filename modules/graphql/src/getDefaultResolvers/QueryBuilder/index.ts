import { GraphQLResolveInfo } from "graphql";

import { parseResolveInfo, IMatch } from "../types";
import { IQueryBuildObject } from "./types";
import QueryBuild from "./QueryBuild";
import { IDefaultResolverMeta } from "../../moduleDefinition/RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";
import { IGraphqlAppConfig } from "../../moduleDefinition/interfaces";
import { ResolveTree } from "graphql-parse-resolve-info";

export * from "./types";

export default class QueryBuilder {
  private _operatorsBuilder: OperatorsBuilder;
  private _defaultResolverMeta: IDefaultResolverMeta;
  private _appConfig: IGraphqlAppConfig;

  public constructor(
    operatorsBuilder: OperatorsBuilder,
    defaultResolverMeta: IDefaultResolverMeta,
    appConfig: IGraphqlAppConfig
  ) {
    this._operatorsBuilder = operatorsBuilder;
    this._defaultResolverMeta = defaultResolverMeta;
    this._appConfig = appConfig;
  }

  public build(
    info: GraphQLResolveInfo,
    isAuthenticated: boolean,
    useRootViews: boolean = false,
    match: IMatch | null = null
  ): IQueryBuildObject {
    const query: ResolveTree = parseResolveInfo(info);

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
    return this._appConfig.options.costLimit;
  }
}
