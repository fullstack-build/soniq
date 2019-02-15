import * as gQlTypeJson from "graphql-type-json";
import { GraphQLResolveInfo } from "graphql";
import { IResolvers, IResolverObject, MergeInfo, IFieldResolver } from "graphql-tools";
import { IOperationsObject } from "./getOperations";

export type ICustomFieldResolver<TSource, TContext, TParams> = (
  source: TSource,
  args: {
    [argument: string]: any;
  },
  context: TContext,
  info: GraphQLResolveInfo & {
    mergeInfo: MergeInfo;
  },
  operationParams: TParams
) => any;

export interface ICustomResolverObject<TSource = any, TContext = any, TParams = any> {
  [key: string]: ICustomFieldResolver<TSource, TContext, TParams>;
}

export function getResolvers(operations: IOperationsObject, resolversObject: ICustomResolverObject): IResolvers {
  const queryResolvers: IResolverObject = {};
  const mutationResolvers: IResolverObject = {};

  operations.queries.forEach((operation) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The resolver "${operation.resolver}" is not defined. You used it in custom Query "${operation.name}".`);
    }

    queryResolvers[operation.name] = wrapResolver(resolversObject[operation.resolver], operation.name);
  });

  operations.mutations.forEach((operation) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The resolver "${operation.resolver}" is not defined. You used it in custom Mutation "${operation.name}".`);
    }

    mutationResolvers[operation.name] = wrapResolver(resolversObject[operation.resolver], operation.params);
  });

  const resolvers: IResolvers = {
    JSON: gQlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  operations.fields.forEach((operation) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(
        `The resolver "${operation.resolver}" is not defined. You used it in custom Field "${operation.fieldName}" in Type "${operation.name}".`
      );
    }

    if (resolvers[operation.gqlTypeName] == null) {
      resolvers[operation.gqlTypeName] = {};
    }

    resolvers[operation.gqlTypeName][operation.fieldName] = wrapResolver(resolversObject[operation.resolver], operation.params);
  });

  return resolvers;
}

function wrapResolver<TSource, TContext, TParams>(
  customResolver: ICustomFieldResolver<TSource, TContext, TParams>,
  operationParams: TParams
): IFieldResolver<TSource, TContext> {
  return (obj, args, context, info) => {
    return customResolver(obj, args, context, info, operationParams);
  };
}
