import { PoolClient } from "@fullstack-one/core";

import { IDefaultMutationResolverContext, IMutationBuildObject, IQueryBuildObject } from "../getDefaultResolvers";
import { TPreQueryHookFunction } from "./types";

export * from "./types";

export class HookManager {
  private preQueryHooks: TPreQueryHookFunction[] = [];

  public addPreQueryHook(hookFunction: TPreQueryHookFunction): void {
    this.preQueryHooks.push(hookFunction);
  }

  public async executePreQueryHooks(
    pgClient: PoolClient,
    context: IDefaultMutationResolverContext,
    authRequired: boolean,
    buildObject: IMutationBuildObject | IQueryBuildObject,
    useContextPgClient: boolean
  ): Promise<void> {
    for (const hook of this.preQueryHooks) {
      await hook(pgClient, context, authRequired, buildObject, useContextPgClient);
    }
  }
}
