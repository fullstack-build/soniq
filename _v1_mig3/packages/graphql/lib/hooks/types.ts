import { PoolClient } from "@fullstack-one/core";

import { IQueryBuildObject, IMutationBuildObject } from "../getDefaultResolvers";

export type TPreQueryHookFunction = (
  pgClient: PoolClient,
  context: any,
  authRequired: boolean,
  buildObject: IMutationBuildObject | IQueryBuildObject,
  useContextPgClient: boolean
) => any;
