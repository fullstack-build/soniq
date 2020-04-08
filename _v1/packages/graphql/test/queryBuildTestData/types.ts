import { IQueryBuildOject, IParsedResolveInfo, IQueryClauseObject } from "../../lib/getDefaultResolvers/types";
import { IResolverMeta, IDbMeta } from "@fullstack-one/schema-builder";

export interface IQueryBuildTestData {
  expected: IQueryBuildOject;
  query: IParsedResolveInfo<IQueryClauseObject>;
  resolverMeta: IResolverMeta;
  dbMeta: IDbMeta;
}
