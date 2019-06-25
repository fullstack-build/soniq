import * as graphQLJSON from "graphql-type-json";
import { GraphQLResolveInfo } from "graphql";
import { IResolvers, IResolverObject, MergeInfo, IFieldResolver } from "graphql-tools";
import { IOperationsObject, IBaseOperation } from "./operations";
import { ReturnIdHandler } from "./ReturnIdHandler";
import { RevertibleResult } from "./RevertibleResult";
import { ILogger } from "@fullstack-one/logger";
import { UserInputError } from ".";

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

export function getResolvers(
  operations: IOperationsObject,
  resolversObject: ICustomResolverObject,
  createQueryRunner: any,
  logger: ILogger
): IResolvers {
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

    mutationResolvers[operation.name] = wrapMutationResolver(
      resolversObject[operation.resolver],
      operation.params,
      operation,
      createQueryRunner,
      logger
    );
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

async function rollbackAndReleaseTransaction(context, logger: ILogger) {
  try {
    await context._transactionQueryRunner.rollbackTransaction();
    await context._transactionQueryRunner.release();
  } catch (err) {
    logger.error("Failed to rollback and release transaction queryRunner.", err);
  }
  context._transactionQueryRunner = null;
  context._transactionRollbackFunctions.forEach(async ({ rollbackFunction, operationName }) => {
    try {
      await rollbackFunction();
    } catch (err) {
      logger.error(`Failed to rollback RevertibleResult of operation '${operationName}'.`, err);
    }
  });
}

function wrapMutationResolver<TSource, TContext, TParams>(
  customResolver: ICustomFieldResolver<TSource, TContext, TParams>,
  operationParams: TParams,
  operation: IBaseOperation,
  createQueryRunner: any,
  logger: ILogger
): IFieldResolver<TSource, TContext> {
  return async (obj, args, context: any, info) => {
    const returnIdHandler = new ReturnIdHandler(context, args.returnId || null);

    if (context._transactionRunning === true) {
      if (context._transactionQueryRunner == null) {
        const err = new UserInputError("This transaction has already been rolled back.");
        err.extensions.exposeDetails = true;
        throw err;
      }
      if (operation.usesQueryRunnerFromContext !== true) {
        await rollbackAndReleaseTransaction(context, logger);
        const err = new UserInputError("This mutation cannot be used inside a transaction. => ROLLBACK");
        err.extensions.exposeDetails = true;
        throw err;
      }

      try {
        const result = await customResolver(obj, args, context, info, operationParams, returnIdHandler);

        if (result instanceof RevertibleResult) {
          context._transactionRollbackFunctions.push({ rollbackFunction: result.getRollbackFunction(), operationName: operation.name });
          return result.getResult();
        }

        return result;
      } catch (err) {
        await rollbackAndReleaseTransaction(context, logger);
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
          logger.error("Failed to release queryRunner.", e);
        }
        context._transactionQueryRunner = null;
      }
    }

    return customResolver(obj, args, context, info, operationParams, returnIdHandler);
  };
}
