module.exports = {
  endpoint:               "/graphql",
  graphiQlEndpointActive: true,
  graphiQlEndpoint:       "/graphiql",
  queryCostLimit:         2000000,
  minQueryDepthToCheckCostLimit: 3,
  resolversPattern:   "/resolvers/*.ts"
};
