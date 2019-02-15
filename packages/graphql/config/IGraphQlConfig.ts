export default interface IGraphQlConfig {
  endpoint: string;
  graphiQlEndpointActive: boolean;
  graphiQlEndpoint: string;
  queryCostLimit: number;
  minQueryDepthToCheckCostLimit: number;
  resolversPattern: string;
}
