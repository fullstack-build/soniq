import { GraphQLResolveInfo } from "graphql";

import { PostgresQueryRunner } from "@fullstack-one/db";
import { Service } from "@fullstack-one/di";

import { IDefaultMutationResolverContext, IMutationBuildObject, IQueryBuildOject } from "../getDefaultResolvers";
import { TPreQueryHookFunction, TPreMutationCommitHookFunction, TPostMutationHookFunction, IHookInfo } from "./types";

export * from "./types";

@Service()
export class HookManager {
  private preQueryHooks: TPreQueryHookFunction[] = [];
  private preMutationCommitHooks: Array<TPreMutationCommitHookFunction<any, any>> = [];
  private postMutationHooks: Array<TPostMutationHookFunction<any, any>> = [];

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
