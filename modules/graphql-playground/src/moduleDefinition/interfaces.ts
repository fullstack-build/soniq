import { MiddlewareOptions } from "graphql-playground-html";

export interface IGraphqlPlaygroundAppConfig {
  disabled: boolean;
  playgroundPath: string;
  middlewareConfig: MiddlewareOptions;
}

export interface IGraphqlPlaygroundAppConfigInput {
  disabled?: boolean;
  playgroundPath?: string;
  middlewareConfig?: MiddlewareOptions;
}
