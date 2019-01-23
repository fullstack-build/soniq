import * as gQlTypeJson from "graphql-type-json";
import { GraphQLResolveInfo } from "graphql";
import { IResolvers, IResolverObject, MergeInfo } from "graphql-tools";
import { IOperations } from "./getOperations";

export type ICustomFieldResolver<TSource = any, TContext = any> = (
  source: TSource,
  args: {
    [argument: string]: any;
  },
  context: TContext,
  info: GraphQLResolveInfo & {
    mergeInfo: MergeInfo;
  },
  operationParams: any
) => any;

export interface ICustomResolverObject<TSource = any, TContext = any> {
  [key: string]: ICustomFieldResolver<TSource, TContext>;
}

export function getResolvers(operations: IOperations, resolversObject: ICustomResolverObject): IResolvers {
  const queryResolvers: IResolverObject = {};
  const mutationResolvers: IResolverObject = {};

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

  const resolvers: IResolvers = {
    // Add JSON Scalar
    JSON: gQlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  // Add  field resolvers to resolvers object
  Object.values(operations.fields).forEach((operation) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(
        `The resolver "${operation.resolver}" is not defined.` +
          ` You used it in custom Field "${operation.fieldName}" in Type "${operation.viewName}".`
      );
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
