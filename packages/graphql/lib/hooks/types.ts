import { PoolClient } from "@fullstack-one/core";

import { IQueryBuildOject, IMutationBuildObject } from "../getDefaultResolvers";

export type TPreQueryHookFunction = (
  pgClient: PoolClient,
  context: any,
  authRequired: boolean,
  buildObject: IMutationBuildObject | IQueryBuildOject
) => any;
