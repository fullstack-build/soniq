
import * as gQlTypeJson from 'graphql-type-json';

export function getResolvers(operations, resolversObject, hooks, dbGeneralPool, logger) {
  const queryResolvers = {};
  const mutationResolvers = {};

  // Add  queries to queryResolvers
  Object.values(operations.queries).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The resolver "${operation.resolver}" is not defined. You used it in custom Query "${operation.name}".`);
    }

    queryResolvers[operation.name] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  // Add  mutations to mutationResolvers
  Object.values(operations.mutations).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The resolver "${operation.resolver}" is not defined. You used it in custom Mutation "${operation.name}".`);
    }

    mutationResolvers[operation.name] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  const resolvers = {
    // Add JSON Scalar
    JSON: gQlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  // Add  field resolvers to resolvers object
  Object.values(operations.fields).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The resolver "${operation.resolver}" is not defined.` +
      ` You used it in custom Field "${operation.fieldName}" in Type "${operation.viewName}".`);
    }

    if (resolvers[operation.gqlTypeName] == null) {
      resolvers[operation.gqlTypeName] = {};
    }

    resolvers[operation.gqlTypeName][operation.fieldName] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  return resolvers;
}
