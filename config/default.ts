export = {
  eventEmitter: {
    namespace: 'f1'
  },
  graphql: {
    endpoint:           '/graphql',
    graphiQlEndpoint:   '/graphiql',
    schemaPattern:      '/schema/*.gql',
    permissionsPattern: '/permissions/*.ts',
    expressionsPattern: '/expressions/*.ts'
  }
};
