import { GraphQLResolveInfo } from "graphql";

import { PgPoolClient } from "@fullstack-one/db";
import { Service } from "@fullstack-one/di";

import { IDefaultMutationResolverContext } from "../getDefaultResolvers";
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

  public addPreMutationCommitHook(hookFunction: TPreMutationCommitHookFunction<any, any>): void {
    this.preMutationCommitHooks.push(hookFunction);
  }

  public addPostMutationCommitHook(hookFunction: TPostMutationHookFunction<any, any>): void {
    this.postMutationHooks.push(hookFunction);
  }

  public async executePreQueryHooks(client: PgPoolClient, context: IDefaultMutationResolverContext, authRequired: boolean): Promise<void> {
    for (const hook of this.preQueryHooks) {
      await hook(client, context, authRequired);
    }
  }

  public async executePreMutationCommitHooks<TSource>(client: PgPoolClient, hookInfo: IHookInfo<any, TSource>): Promise<void> {
    for (const hook of this.preMutationCommitHooks) {
      await hook(client, hookInfo);
    }
  }

  public async executePostMutationHooks<TSource>(
    hookInfo: IHookInfo<any, TSource>,
    context: IDefaultMutationResolverContext,
    info: GraphQLResolveInfo,
    overWriteReturnData: (returnData: any) => any
  ): Promise<void> {
    for (const hook of this.postMutationHooks) {
      await hook(hookInfo, context, info, overWriteReturnData);
    }
  }
}
