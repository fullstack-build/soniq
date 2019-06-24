import * as graphQLJSON from "graphql-type-json";
import { GraphQLResolveInfo } from "graphql";
import { IResolvers, IResolverObject, MergeInfo, IFieldResolver } from "graphql-tools";
import { IOperationsObject, IBaseOperation } from "./operations";
import { ReturnIdHandler } from "./ReturnIdHandler";
import { RevertibleResult } from "./RevertibleResult";

export type ICustomFieldResolver<TSource, TContext, TParams> = (
  source: TSource,
  args: {
    [argument: string]: any;
  },
  context: TContext,
  info: GraphQLResolveInfo & {
    mergeInfo: MergeInfo;
  },
  operationParams: TParams,
  returnIdHandler: ReturnIdHandler
) => any;

export interface ICustomResolverObject<TSource = any, TContext = any, TParams = any> {
  [key: string]: ICustomFieldResolver<TSource, TContext, TParams>;
}

export function getResolvers(operations: IOperationsObject, resolversObject: ICustomResolverObject, createQueryRunner: any): IResolvers {
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

    mutationResolvers[operation.name] = wrapMutationResolver(resolversObject[operation.resolver], operation.params, operation, createQueryRunner);
  });

  const resolvers: IResolvers = {
    JSON: graphQLJSON,
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
  return (obj, args, context: any, info) => {
    return customResolver(obj, args, context, info, operationParams, null);
  };
}

async function rollbackAndReleaseTransaction(context) {
  try {
    await context._transactionQueryRunner.rollbackTransaction();
  } catch (err) {
    // tslint:disable-next-line:no-console => TODO: Import logger
    console.error("Failed to rollback transaction queryRunnter.", err);
  } finally {
    await context._transactionQueryRunner.release();
    context._transactionQueryRunner = null;
  }
  context._transactionRollbackFunctions.forEach(async ({ rollbackFunction, operationName }) => {
    try {
      await rollbackFunction();
    } catch (err) {
      // tslint:disable-next-line:no-console => TODO: Import logger
      console.error(`Failed to rollback RevertibleResult of operation '${operationName}'.`, err);
    }
  });
}

function wrapMutationResolver<TSource, TContext, TParams>(
  customResolver: ICustomFieldResolver<TSource, TContext, TParams>,
  operationParams: TParams,
  operation: IBaseOperation,
  createQueryRunner: any
): IFieldResolver<TSource, TContext> {
  return async (obj, args, context: any, info) => {
    const returnIdHandler = new ReturnIdHandler(context, args.returnId || null);

    if (context._transactionQueryRunner != null) {
      if (operation.usesQueryRunnerFromContext !== true) {
        await rollbackAndReleaseTransaction(context);
        throw new Error("This mutation cannot be used inside a transaction. => ROLLBACK");
      }

      try {
        const result = await customResolver(obj, args, context, info, operationParams, returnIdHandler);

        if (result instanceof RevertibleResult) {
          context._transactionRollbackFunctions.push({ rollbackFunction: result.getRollbackFunction(), operationName: operation.name });
          return result.getResult();
        }

        return result;
      } catch (err) {
        await rollbackAndReleaseTransaction(context);
        throw err;
      }
    }

    if (operation.usesQueryRunnerFromContext === true) {
      try {
        context._transactionQueryRunner = createQueryRunner();
        await context._transactionQueryRunner.connect();
        await context._transactionQueryRunner.startTransaction();
        const result = await customResolver(obj, args, context, info, operationParams, returnIdHandler);
        await context._transactionQueryRunner.commitTransaction();
        return result;
      } catch (err) {
        throw err;
      } finally {
        try {
          await context._transactionQueryRunner.release();
        } catch (e) {
          // tslint:disable-next-line:no-console => TODO: Import logger
          console.error("Failed to release queryRunner.");
        }
        context._transactionQueryRunner = null;
      }
    }

    return customResolver(obj, args, context, info, operationParams, returnIdHandler);
  };
}
