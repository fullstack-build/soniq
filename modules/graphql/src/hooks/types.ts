/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from "soniq";

import { IQueryBuildObject, IMutationBuildObject } from "../getDefaultResolvers";

export type TPreQueryHookFunction = (
  pgClient: PoolClient,
  context: any,
  authRequired: boolean,
  buildObject: IMutationBuildObject | IQueryBuildObject,
  useContextPgClient: boolean
) => any;
