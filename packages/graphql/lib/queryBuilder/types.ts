export type TPreQueryHookFunction = (client: any, context: any, authRequired: boolean) => any;
export type TPreMutationCommitHookFunction = (client: any, hookInfo: any) => any;
export type TPostMutationHookFunction = (hookInfo: any, context: any, info: any) => any;

export interface IHookObject {
  preQuery: TPreQueryHookFunction[];
  preMutationCommit: TPreMutationCommitHookFunction[];
  postMutation: TPostMutationHookFunction[];
}
