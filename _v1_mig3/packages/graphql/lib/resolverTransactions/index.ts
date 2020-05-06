import * as graphQLJSON from "graphql-type-json";
import { GraphQLResolveInfo } from "graphql";
import { MergeInfo, IFieldResolver, IResolvers } from "graphql-tools";
import { ReturnIdHandler } from "./ReturnIdHandler";
import { RevertibleResult } from "./RevertibleResult";
import { ILogger } from "@fullstack-one/logger";
import { UserInputError } from "../GraphqlErrors";
import { IResolver } from "../RuntimeInterfaces";
import { Pool } from "@fullstack-one/core";

export type ICustomFieldResolver<TSource, TContext> = (
  source: TSource,
  args: {
    [argument: string]: any;
  },
  context: TContext,
  info: GraphQLResolveInfo & {
    mergeInfo: MergeInfo;
  },
  returnIdHandler: ReturnIdHandler
) => any;

export interface ICustomResolverMeta {
  resolver: ICustomFieldResolver<any, any>;
  usesPgClientFromContext: boolean;
}

export type ICustomResolverCreator = (resolver: IResolver) => ICustomResolverMeta;

export interface ICustomResolverObject {
  [key: string]: ICustomResolverCreator;
}

export function getResolvers(appResolvers: IResolver[], resolversObject: ICustomResolverObject, pgPool: Pool, logger: ILogger): IResolvers {
  const resolvers: IResolvers = {
    JSON: graphQLJSON,
    Query: {},
    Mutation: {}
  };

  appResolvers.forEach((resolver) => {
    if (resolversObject[resolver.key] == null) {
      return logger.error(`The resolver "${resolver.key}" is not defined. You used it in custom resolver "${resolver.path}".`);
    }
    let resolverMeta: ICustomResolverMeta;
    try {
      resolverMeta = resolversObject[resolver.key](resolver);
    } catch (err) {
      return logger.error(`The resolver "${resolver.key}" failed to initialize.`, err);
    }
    const splittedPath = resolver.path.split(".");
    if (splittedPath.length !== 2) {
      return logger.error(`The resolver "${resolver.key}" must have 2 levels in path.`);
    }

    const firstPath = splittedPath[0];
    const secondPath = splittedPath[1];

    if (resolverMeta.usesPgClientFromContext === true && firstPath !== "Mutation") {
      return logger.error(`The resolver "${resolver.key}" can only be used for mutations.`);
    }

    if (resolvers[firstPath] == null) {
      resolvers[firstPath] = {};
    }

    switch (firstPath) {
      case "Mutation":
        resolvers[firstPath][secondPath] = wrapMutationResolver(resolverMeta, resolver, pgPool, logger);
        break;
      // For any Type and Query
      default:
        resolvers[firstPath][secondPath] = wrapResolver(resolverMeta, resolver);
        break;
    }
  });

  return resolvers;
}

function wrapResolver<TSource, TContext>(resolverMeta: ICustomResolverMeta, resolver: IResolver): IFieldResolver<TSource, TContext> {
  return (obj, args, context: any, info) => {
    context._isRequestGqlQuery = true;
    return resolverMeta.resolver(obj, args, context, info, null);
  };
}

async function rollbackAndReleaseTransaction(context: any, logger: ILogger) {
  try {
    await context._transactionPgClient.query("ROLLBACK;");
  } catch (err) {
    logger.error("Failed to rollback transaction pgClient.", err);
  }
  try {
    await context._transactionPgClient.release();
  } catch (err) {
    logger.error("Failed to release transaction pgClient.", err);
  }
  context._transactionPgClient = null;
  context._transactionRollbackFunctions.forEach(async ({ rollbackFunction, resolverKey }) => {
    try {
      await rollbackFunction();
    } catch (err) {
      logger.error(`Failed to rollback RevertibleResult of resolver '${resolverKey}'.`, err);
    }
  });
}

function wrapMutationResolver<TSource, TContext, TParams>(
  resolverMeta: ICustomResolverMeta,
  resolver: IResolver,
  pgPool: Pool,
  logger: ILogger
): IFieldResolver<TSource, TContext> {
  return async (obj, args, context: any, info) => {
    const returnIdHandler = new ReturnIdHandler(context, args.returnId || null);

    if (context._transactionRunning === true) {
      if (context._transactionPgClient == null) {
        throw new UserInputError("This transaction has already been rolled back.", { exposeDetails: true });
      }
      if (resolverMeta.usesPgClientFromContext !== true) {
        await rollbackAndReleaseTransaction(context, logger);
        throw new UserInputError("This mutation cannot be used inside a transaction. => ROLLBACK", { exposeDetails: true });
      }

      try {
        const result = await resolverMeta.resolver(obj, args, context, info, returnIdHandler);

        if (result instanceof RevertibleResult) {
          context._transactionRollbackFunctions.push({ rollbackFunction: result.getRollbackFunction(), resolverKey: resolver.key });

          const onCommitedHandler = result.getOnCommitedHandler();
          if (onCommitedHandler != null) {
            context._transactionOnCommitedHandlers.push({ onCommitedHandler, resolverKey: resolver.key });
          }

          return result.getResult();
        }

        return result;
      } catch (err) {
        await rollbackAndReleaseTransaction(context, logger);
        throw err;
      }
    }

    if (resolverMeta.usesPgClientFromContext === true) {
      if (context.pgClient != null) {
        context._transactionPgClient = context.pgClient;
        const result = await resolverMeta.resolver(obj, args, context, info, returnIdHandler);

        if (result instanceof RevertibleResult) {
          return result.getResult();
        } else {
          return result;
        }
      }

      let rollbackFunction = null;
      let onCommitedHandler = null;

      try {
        context._transactionPgClient = await pgPool.connect();
        await context._transactionPgClient.query("BEGIN;");
        context._transactionIsAuthenticated = false;
        const result = await resolverMeta.resolver(obj, args, context, info, returnIdHandler);
        let finalResult: any;

        if (result instanceof RevertibleResult) {
          rollbackFunction = result.getRollbackFunction();
          onCommitedHandler = result.getOnCommitedHandler();

          finalResult = result.getResult();
        } else {
          finalResult = result;
        }

        await context._transactionPgClient.query("COMMIT;");
        try {
          if (onCommitedHandler != null) {
            await onCommitedHandler();
          }
        } catch (e) {
          logger.error(`Failed to call onCommitedHandler of resolver '${resolver.key}'.`, e);
        }

        return finalResult;
      } catch (err) {
        try {
          await context._transactionPgClient.query("ROLLBACK;");
        } catch (e) {
          logger.error("Failed to rollback pgClient.", e);
        }
        try {
          if (rollbackFunction != null) {
            await rollbackFunction();
          }
        } catch (e) {
          logger.error(`Failed to rollback RevertibleResult of resolver '${resolver.key}'.`, e);
        }
        throw err;
      } finally {
        try {
          await context._transactionPgClient.release();
        } catch (e) {
          logger.error("Failed to release pgClient.", e);
        }
        context._transactionPgClient = null;
      }
    }

    return resolverMeta.resolver(obj, args, context, info, returnIdHandler);
  };
}
