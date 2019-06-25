import { PostgresQueryRunner } from "@fullstack-one/db";

import { IQueryBuildOject, IMutationBuildObject } from "../getDefaultResolvers";

export type TPreQueryHookFunction = (
  queryRunner: PostgresQueryRunner,
  context: any,
  authRequired: boolean,
  buildObject: IMutationBuildObject | IQueryBuildOject
) => any;
