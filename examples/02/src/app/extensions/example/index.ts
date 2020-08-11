import { Logger, TCreateModuleExtensionConnectorFunction, registerExtension } from "soniq";
import { Koa, ServerExtensionConnector } from "@soniq/server";
import { GraphqlExtensionConnector, ReturnIdHandler } from "@soniq/graphql";
import { IResolverMapping } from "@soniq/graphql/src/RuntimeInterfaces";

registerExtension(() => {
  return {
    attach: (logger: Logger, createModuleExtensionConnector: TCreateModuleExtensionConnectorFunction) => {
      setTimeout(() => {
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
                usesPgClientFromContext: true,
                resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
                  return `Welcome <<<${args.name}3!`;
                },
              };
            },
          },
        });
      }, 1000 * 3);
    },
    detach: (logger: Logger) => {
      logger.info("Detaching example extension.");
    },
  };
});
