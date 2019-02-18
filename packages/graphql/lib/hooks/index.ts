import { GraphQLResolveInfo } from "graphql";

import { PgPoolClient } from "@fullstack-one/db";
import { Service } from "@fullstack-one/di";

import { IDefaultMutationResolverContext } from "../getDefaultResolvers";
import { TPreQueryHookFunction, TPreMutationCommitHookFunction, TPostMutationHookFunction, IHookConfig, IHookInfo } from "./types";

export * from "./types";

@Service()
export class HookManager {
  private preQueryHooks: TPreQueryHookFunction[] = [];
  private preMutationCommitHooks: Array<TPreMutationCommitHookFunction<any, any>> = [];
  private postMutationHooks: Array<TPostMutationHookFunction<any, any>> = [];

  public addHook(config: IHookConfig) {
    if (config.type === "preQuery") this.preQueryHooks.push(config.hook);
    if (config.type === "preMutationCommit") this.preMutationCommitHooks.push(config.hook);
    if (config.type === "postMutation") this.postMutationHooks.push(config.hook);
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
    info: GraphQLResolveInfo
  ): Promise<void> {
    for (const hook of this.postMutationHooks) {
      await hook(hookInfo, context, info);
    }
  }
}
