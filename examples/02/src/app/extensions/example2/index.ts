import { Logger, TCreateModuleExtensionConnectorFunction, registerExtension } from "soniq";
import { Koa, ServerExtensionConnector } from "@soniq/server";

registerExtension(() => {
  return {
    attach: (logger: Logger, createModuleExtensionConnector: TCreateModuleExtensionConnectorFunction) => {
      logger.info("Attaching example extension.");

      const serverConnector: ServerExtensionConnector = createModuleExtensionConnector(
        "Server"
      ) as ServerExtensionConnector;

      //const foobar = lodash.get(serverConnector, "addKoaMiddleware");

      serverConnector.addKoaMiddleware((ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.path.startsWith("/extensionDemo6")) {
          ctx.body = "Hallo Test 12 XX\n"; //+ moment().format('LLLL') + "\n" + moment().format('LTS');
        } else {
          return next();
        }
      });
    },
    detach: (logger: Logger) => {
      logger.info("Detaching example extension.");
    },
  };
});