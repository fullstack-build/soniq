import { MiddlewareOptions } from "graphql-playground-html";

export interface IGraphqlPlaygroundAppConfig {
  disabled: boolean;
  playgroundPath: string;
  middlewareConfig: MiddlewareOptions;
}

export interface IGraphqlPlaygroundAppConfigOptional {
  disabled?: boolean;
  playgroundPath?: string;
  middlewareConfig?: MiddlewareOptions;
}

export interface IGraphqlPlaygroundRuntimeConfig extends IGraphqlPlaygroundAppConfig {}

export interface IGetGraphqlPlaygroundModuleRuntimeConfigResult {
  runtimeConfig: IGraphqlPlaygroundRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetGraphqlPlaygroundModuleRuntimeConfig = (
  updateKey?: string
) => Promise<IGetGraphqlPlaygroundModuleRuntimeConfigResult>;
