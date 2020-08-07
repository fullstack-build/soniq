import { PoolClient, QueryResult } from "soniq";
import { Logger } from "soniq";

import { HookManager } from "../hooks";
import { IMatch } from "./types";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import MutationBuilder, { IMutationBuildObject } from "./MutationBuilder";
import QueryBuilder, { IQueryBuildObject } from "./QueryBuilder";
import { ReturnIdHandler } from "../resolverTransactions/ReturnIdHandler";
import { UserInputError } from "../GraphqlErrors";
import { ICustomResolverCreator } from "../resolverTransactions";

export default function getDefaultMutationResolver(
  logger: Logger,
  hookManager: HookManager,
  queryBuilder: QueryBuilder,
  mutationBuilder: MutationBuilder
): ICustomResolverCreator {
  return (resolver) => {
    return {
      usesPgClientFromContext: true,
      resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
        const isAuthenticated: boolean = context.accessToken != null;
        const useRootViews: boolean = context.useRootViews === true;

        const mutationBuild: IMutationBuildObject = mutationBuilder.build(info, returnIdHandler);
        context.ctx.state.includesMutation = true;

        const useContextPgClient: boolean = context.pgClient != null;

        const pgClient: PoolClient = context._transactionPgClient;

        await hookManager.executePreQueryHooks(pgClient, context, isAuthenticated, mutationBuild, useContextPgClient);

        logger.info("mutationResolver.run", mutationBuild.sql, mutationBuild.values);

        const result: QueryResult = await pgClient.query(mutationBuild.sql, mutationBuild.values);

        const isUpdateOrDeleteMutation: boolean =
          mutationBuild.mutation.type === "UPDATE" || mutationBuild.mutation.type === "DELETE";

        if (isUpdateOrDeleteMutation && result.rowCount < 1) {
          throw new UserInputError(
            "No rows affected by this mutation. Either the entity does not exist or you are not permitted."
          );
        }

        let returnQueryBuild: IQueryBuildObject | undefined;
        let returnData: unknown;
        let entityId: string | null = mutationBuild.id || null;
        let match: IMatch | undefined;

        // Workaround: Postgres does not return id for INSERT without SELECT permission.
        // Therefore we retrieve the last generated UUID in transaction.
        // Our concept allows one one INSERT per transaction.
        if (entityId == null && mutationBuild.mutation.type === "CREATE") {
          const idResult: QueryResult = await pgClient.query(
            'SELECT "_graphql_meta"."get_last_generated_uuid"() AS "id";'
          );
          if (idResult.rows[0] == null || idResult.rows[0].id == null) {
            throw new UserInputError(
              "No rows affected by this mutation. Either the entity does not exist or you are not permitted."
            );
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
            ownColumnExpression: `'${entityId}'::uuid`,
          };

          // Generate sql query for response-data of the mutation
          returnQueryBuild = queryBuilder.build(info, isAuthenticated, useRootViews, match);

          logger.info("mutationResolver.returnQuery.run", returnQueryBuild.sql, returnQueryBuild.values);

          await checkCosts(pgClient, returnQueryBuild, queryBuilder.getCostLimit());

          // Run SQL query on pg to get response-data
          const returnResult: QueryResult = await pgClient.query(returnQueryBuild.sql, returnQueryBuild.values);
          checkQueryResultForInjection(returnResult.rows, logger);

          const resultData: unknown[] = returnResult.rows[0][returnQueryBuild.queryName];

          if (resultData.length < 1) {
            throw new UserInputError(
              "The return-query of this mutation has no entries. Perhaps you are not permitted to access the results." +
                " You can set 'returnOnlyId' on the permission-view to be able to run this mutation without changing read-permissions."
            );
          }

          // set data from row 0
          returnData = resultData[0];
        }

        return returnData;
      },
    };
  };
}
