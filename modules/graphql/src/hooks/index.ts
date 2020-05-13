import { PoolClient } from "soniq";

import { IDefaultMutationResolverContext, IMutationBuildObject, IQueryBuildObject } from "../getDefaultResolvers";
import { TPreQueryHookFunction } from "./types";

export * from "./types";

export class HookManager {
  private _preQueryHooks: TPreQueryHookFunction[] = [];

  public addPreQueryHook(hookFunction: TPreQueryHookFunction): void {
    this._preQueryHooks.push(hookFunction);
  }

  public async executePreQueryHooks(
    pgClient: PoolClient,
    context: IDefaultMutationResolverContext,
    authRequired: boolean,
    buildObject: IMutationBuildObject | IQueryBuildObject,
    useContextPgClient: boolean
  ): Promise<void> {
    for (const hook of this._preQueryHooks) {
      await hook(pgClient, context, authRequired, buildObject, useContextPgClient);
    }
  }
}
