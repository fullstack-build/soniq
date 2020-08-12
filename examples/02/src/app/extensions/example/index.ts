import {
  Logger,
  TCreateModuleExtensionConnectorFunction,
  registerExtension,
  CoreExtensionConnector,
  Pool,
  PoolClient,
} from "soniq";
import { Koa, ServerExtensionConnector } from "@soniq/server";
import { GraphqlExtensionConnector, ReturnIdHandler, GraphQlClient, FormattedExecutionResult } from "@soniq/graphql";
import { IResolverMapping } from "@soniq/graphql/src/RuntimeInterfaces";
import { AuthExtensionConnector } from "@soniq/auth";
import { AuthQueryHelper } from "@soniq/auth/src/AuthQueryHelper";

registerExtension(() => {
  return {
    attach: (logger: Logger, createModuleExtensionConnector: TCreateModuleExtensionConnectorFunction) => {
      logger.info("Attaching example extension.");

      const serverConnector: ServerExtensionConnector = createModuleExtensionConnector(
        "Server"
      ) as ServerExtensionConnector;

      // const foobar = lodash.get(serverConnector, "addKoaMiddleware");

      serverConnector.addKoaMiddleware((ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.path.startsWith("/extensionDemo4")) {
          ctx.body = "Hallo Evgenij 11 X\n"; //+ moment().format('LLLL') + "\n" + moment().format('LTS');
        } else {
          return next();
        }
      });

      const graphqlConnector: GraphqlExtensionConnector = createModuleExtensionConnector(
        "GraphQl"
      ) as GraphqlExtensionConnector;

      const coreConnector: CoreExtensionConnector = createModuleExtensionConnector("Core") as CoreExtensionConnector;
      const authConnector: AuthExtensionConnector = createModuleExtensionConnector("Auth") as AuthExtensionConnector;

      graphqlConnector.addRuntimeExtension({
        schemaExtensions: [
          `
          extend type Mutation {
            exampleDemo3(name: String!): String!
          }
        `,
        ],
        resolverMappings: [
          {
            path: "Mutation.exampleDemo3",
            key: "soniqExample/Mutation/exampleDemo",
            config: {},
          },
        ],
        resolverObject: {
          "soniqExample/Mutation/exampleDemo": (resolverMapping: IResolverMapping) => {
            return {
              usesPgClientFromContext: false,
              resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
                const graphQlClient: GraphQlClient = await graphqlConnector.getGraphQlClient();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const pgPool: Pool = coreConnector.getPgPool();

                // const pgClient: PoolClient = await pgPool.connect();

                const authQueryHelper: AuthQueryHelper = authConnector.getAuthQueryHelper();

                const result: FormattedExecutionResult = (await authQueryHelper.transaction(
                  async (pgClient: PoolClient) => {
                    const res: FormattedExecutionResult = await graphQlClient.query(
                      `
                    {
                      Users {
                        id
                        dodo: firstName
                        lastName
                      }
                    }
                  `,
                      {
                        context: {
                          useRootViews: true,
                          pgClient,
                        },
                      }
                    );

                    return res;
                  },
                  { rootAccess: true }
                )) as FormattedExecutionResult;

                // pgClient.release();

                return `Welcome <<<${args.name}3! ${JSON.stringify(result)}`;
              },
            };
          },
        },
      });
    },
    detach: (logger: Logger) => {
      logger.info("Detaching example extension.");
    },
  };
});
