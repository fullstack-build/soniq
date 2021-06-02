import { IGraphqlOptions } from "./interfaces";

export const defaultAppConfig: IGraphqlOptions = {
  costLimit: 2000000000,
  minSubqueryCountToCheckCostLimit: 3,
  introspectionActive: false,
  endpointPath: "/graphql",
  dangerouslyExposeErrorDetails: false,
};
