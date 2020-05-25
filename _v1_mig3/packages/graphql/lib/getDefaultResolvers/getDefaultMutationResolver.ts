import { IFieldResolver } from "graphql-tools";

import { PoolClient } from "@fullstack-one/core";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";

import { HookManager } from "../hooks";
import { IDefaultMutationResolverContext, IMatch } from "./types";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import MutationBuilder, { IMutationBuildObject } from "./MutationBuilder";
import QueryBuilder, { IQueryBuildObject } from "./QueryBuilder";
import { ReturnIdHandler } from "../resolverTransactions/ReturnIdHandler";
import { UserInputError } from "../GraphqlErrors";
import { ICustomResolverCreator } from "../resolverTransactions";

export default function getDefaultMutationResolver(
  logger: ILogger,
  hookManager: HookManager,
  queryBuilder: QueryBuilder,
  mutationBuilder: MutationBuilder
): ICustomResolverCreator {
  return (resolver) => {
    return {
      usesPgClientFromContext: true,
      resolver: async (obj, args, context: any, info, returnIdHandler: ReturnIdHandler) => {
        const isAuthenticated = context.accessToken != null;
        const useRootViews = context.useRootViews === true;

        const mutationBuild: IMutationBuildObject = mutationBuilder.build(info, returnIdHandler);
        context.ctx.state.includesMutation = true;

        const useContextPgClient = context.pgClient != null;

        const pgClient: PoolClient = context._transactionPgClient;

        await hookManager.executePreQueryHooks(pgClient, context, isAuthenticated, mutationBuild, useContextPgClient);

        logger.trace("mutationResolver.run", mutationBuild.sql, mutationBuild.values);

        const result = await pgClient.query(mutationBuild.sql, mutationBuild.values);

        if ((mutationBuild.mutation.type === "UPDATE" || mutationBuild.mutation.type === "DELETE") && result.rowCount < 1) {
          throw new UserInputError("No rows affected by this mutation. Either the entity does not exist or you are not permitted.", {
            exposeDetails: true
          });
        }

        let returnQueryBuild: IQueryBuildObject | undefined;
        let returnData: any;
        let entityId = mutationBuild.id || null;
        let match: IMatch | undefined;

        // Workaround: Postgres does not return id for INSERT without SELECT permission.
        // Therefore we retrieve the last generated UUID in transaction.
        // Our concept allows one one INSERT per transaction.
        if (entityId == null && mutationBuild.mutation.type === "CREATE") {
          const idResult = await pgClient.query('SELECT "_graphql_meta"."get_last_generated_uuid"() AS "id";');
          if (idResult.rows[0] == null || idResult.rows[0].id == null) {
            throw new UserInputError("No rows affected by this mutation. Either the entity does not exist or you are not permitted.", {
              exposeDetails: true
            });
          }

          entityId = idResult.rows[0].id;
        }
        returnIdHandler.setReturnId(entityId);

        // Check if this mutations returnType is ID
        // e.g. When mutationType is DELETE just return the id. Otherwise query for the new data.
        // e.g. When this is a user-creation the creator has no access to his own user before login.
        // tslint:disable-next-line:prettier
        if (mutationBuild.mutation.returnOnlyId === true) {
          returnData = entityId;
        } else {
          // Create a match to search for the new created or updated entity
          match = {
            foreignColumnName: "id",
            ownColumnExpression: `'${entityId}'::uuid`
          };

          // Generate sql query for response-data of the mutation
          returnQueryBuild = queryBuilder.build(info, isAuthenticated, useRootViews, match);

          logger.trace("mutationResolver.returnQuery.run", returnQueryBuild.sql, returnQueryBuild.values);

          await checkCosts(pgClient, returnQueryBuild, queryBuilder.getCostLimit());

          // Run SQL query on pg to get response-data
          const returnResult = await pgClient.query(returnQueryBuild.sql, returnQueryBuild.values);
          checkQueryResultForInjection(returnResult.rows, logger);

          const resultData = returnResult.rows[0][returnQueryBuild.queryName];

          if (resultData.length < 1) {
            throw new UserInputError(
              "The return-query of this mutation has no entries. Perhaps you are not permitted to access the results." +
                " You can set 'returnOnlyId' on the permission-view to be able to run this mutation without changing read-permissions.",
              { exposeDetails: true }
            );
          }

          // set data from row 0
          returnData = resultData[0];
        }

        return returnData;
      }
    };
  };
}
