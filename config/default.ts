export = {
  core: {
    namespace: 'f1'
  },
  eventEmitter: {},
  graphql: {
    endpoint:           '/graphql',
    graphiQlEndpoint:   '/graphiql',
    schemaPattern:      '/schema/*.gql',
    permissionsPattern: '/permissions/*.ts',
    expressionsPattern: '/expressions/*.ts',
    resolversPattern: '/resolvers/*.ts'
  },
  db: {
    viewSchemaName: 'graphql'
  }
};
