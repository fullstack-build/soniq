import { ILogger } from "@fullstack-one/logger";
import { IFieldResolver } from "graphql-tools";
import { IDefaultMutationResolverContext } from ".";
import { ORM } from "@fullstack-one/db";

export function getBeginTransactionResolver<TSource>(orm: ORM, logger: ILogger): IFieldResolver<TSource, IDefaultMutationResolverContext> {
  return async (obj, args, context: any, info) => {
    if (context._transactionQueryRunner != null) {
      throw new Error("You cannot begin a second transaction within another.");
    }
    context._transactionQueryRunner = orm.createQueryRunner();
    context._transactionRollbackFunctions = [];

    let rows = [];
    try {
      await context._transactionQueryRunner.connect();
      await context._transactionQueryRunner.startTransaction();
      rows = await context._transactionQueryRunner.query("SELECT txid_current();");
    } catch (err) {
      logger.error("Failed to connect and create transaction.");
      try {
        await context._transactionQueryRunner.rollbackTransaction();
      } catch (e) {
        logger.error("Failed to rollback transaction.", e);
      }
      try {
        await context._transactionQueryRunner.release();
      } catch (e) {
        logger.error("Failed to release transactionQueryRunner.", e);
      } finally {
        context._transactionQueryRunner = null;
      }
      throw err;
    }
    return rows[0].txid_current;
  };
}

export function getCommitTransactionResolver<TSource>(orm: ORM, logger: ILogger): IFieldResolver<TSource, IDefaultMutationResolverContext> {
  return async (obj, args, context: any, info) => {
    if (context._transactionQueryRunner == null) {
      throw new Error("You cannot commit a not existing transaction.");
    }
    let rows = [];
    try {
      rows = await context._transactionQueryRunner.query("SELECT txid_current();");
      await context._transactionQueryRunner.commitTransaction();
    } catch (err) {
      logger.error("Failed to commit transaction.");
      try {
        await context._transactionQueryRunner.rollbackTransaction();
      } catch (e) {
        logger.error("Failed to rollback transaction.", e);
      }
      throw err;
    } finally {
      try {
        await context._transactionQueryRunner.release();
      } catch (e) {
        logger.error("Failed to release transactionQueryRunner.", e);
      } finally {
        context._transactionQueryRunner = null;
      }
    }
    return rows[0].txid_current;
  };
}
