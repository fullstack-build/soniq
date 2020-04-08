import { GraphQLResolveInfo } from "graphql";

import { PostgresQueryRunner } from "@fullstack-one/db";
import { Service } from "@fullstack-one/di";

import { IDefaultMutationResolverContext, IMutationBuildObject, IQueryBuildOject } from "../getDefaultResolvers";
import { TPreQueryHookFunction } from "./types";

export * from "./types";

@Service()
export class HookManager {
  private preQueryHooks: TPreQueryHookFunction[] = [];

  public addPreQueryHook(hookFunction: TPreQueryHookFunction): void {
    this.preQueryHooks.push(hookFunction);
  }

  public async executePreQueryHooks(
    queryRunner: PostgresQueryRunner,
    context: IDefaultMutationResolverContext,
    authRequired: boolean,
    buildObject: IMutationBuildObject | IQueryBuildOject
  ): Promise<void> {
    for (const hook of this.preQueryHooks) {
      await hook(queryRunner, context, authRequired, buildObject);
    }
  }
}
