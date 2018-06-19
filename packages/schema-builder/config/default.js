module.exports = {
  graphql: {
    schemaPattern:      '/schema/*.gql',
    permissionsPattern:       '/permissions/*.ts',
    expressionsPattern: '/expressions/*.ts',
    resolversPattern:   '/resolvers/*.ts'
  },
  schemaBuilder: {
    setUserPrivileges: false
  }
};
