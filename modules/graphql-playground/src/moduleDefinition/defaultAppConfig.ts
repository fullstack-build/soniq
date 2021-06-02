import { IGraphqlPlaygroundAppConfig } from "./interfaces";

export const defaultAppConfig: IGraphqlPlaygroundAppConfig = {
  disabled: false,
  playgroundPath: "/playground",
  middlewareConfig: {
    endpoint: "/graphql",
    settings: {
      "editor.cursorShape": "line",
      "editor.fontFamily": "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
      "editor.fontSize": 14,
      "editor.reuseHeaders": true,
      "editor.theme": "dark",
      "general.betaUpdates": false,
      "request.credentials": "include",
      "tracing.hideTracingResponse": true,
      "tracing.tracingSupported": true,
    },
  },
};
