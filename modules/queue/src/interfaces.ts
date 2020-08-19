export interface IQueueRuntimeConfig {
  usePool: boolean;
}

export interface IGetQueueModuleRuntimeConfigResult {
  runtimeConfig: IQueueRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetQueueModuleRuntimeConfig = (updateKey?: string) => Promise<IGetQueueModuleRuntimeConfigResult>;
