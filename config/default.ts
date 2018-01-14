export = {
  core: {
    namespace: 'f1'
  },
  eventEmitter: {},
  graphql: {
    endpoint:           '/graphql',
    graphiQlEndpoint:   '/graphiql',
    schemaPattern:      '/schema/*.gql',
    viewsPattern: '/views/*.ts',
    expressionsPattern: '/expressions/*.ts',
    resolversPattern: '/resolvers/*.ts'
  },
  db: {
    viewSchemaName: 'graphql'
  },
  auth: {
    sodium: {},
    oAuth: {
      cookie: {
        maxAge: 86400000,
        overwrite: true,
        httpOnly: true,
        signed: true
      },
      providers: {
        /*facebook: {
          name: 'facebook',
          tenant: 'default',
          strategy: FacebookStrategy,
          config: {
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET
          }
        }*/
      },
      frontendOrigins: [
        'localhost:8000'
      ]
    },
    cookie: {
      name: 'access_token',
      maxAge: 86400000,
      overwrite: true,
      httpOnly: true,
      signed: true
    },
    tokenQueryParameter: 'access_token',
    enableDefaultLocalStrategie: true
  }
};
