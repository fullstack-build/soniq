import { GraphQLResolveInfo } from "graphql";

import { IParsedResolveInfo, parseResolveInfo, IMatch } from "../types";
import { IQueryBuildObject, IQueryClauseObject } from "./types";
import QueryBuild from "./QueryBuild";
import { IDefaultResolverMeta } from "../../RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";
import { IGraphqlOptions } from "../../moduleDefinition/interfaces";

export * from "./types";

export default class QueryBuilder {
  private _operatorsBuilder: OperatorsBuilder;
  private _defaultResolverMeta: IDefaultResolverMeta;
  private _options: IGraphqlOptions;

  public constructor(
    operatorsBuilder: OperatorsBuilder,
    defaultResolverMeta: IDefaultResolverMeta,
    options: IGraphqlOptions
  ) {
    this._operatorsBuilder = operatorsBuilder;
    this._defaultResolverMeta = defaultResolverMeta;
    this._options = options;
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
    return this._options.costLimit;
  }
}
