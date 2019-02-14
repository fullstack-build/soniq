export default interface IConfig {
  endpoint: string;
  graphiQlEndpointActive: boolean;
  graphiQlEndpoint: string;
  queryCostLimit: number;
  minQueryDepthToCheckCostLimit: number;
  resolversPattern: string;
}
