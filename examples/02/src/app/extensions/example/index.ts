import { Logger, TCreateModuleExtensionConnectorFunction } from "soniq";
import { Koa, ServerExtensionConnector } from "@soniq/server";
/*
// @ts-ignore
import * as lodash from "lodash";
import * as moment from "moment";*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let soniqExtensionContext: any;

soniqExtensionContext.registerNewExtension = () => {
  return {
    attach: (logger: Logger, createModuleExtensionConnector: TCreateModuleExtensionConnectorFunction) => {
      logger.info("Attaching example extension.");

      const serverConnector: ServerExtensionConnector = createModuleExtensionConnector(
        "Server"
      ) as ServerExtensionConnector;

      // const foobar = lodash.get(serverConnector, "addKoaMiddleware");

      serverConnector.addKoaMiddleware((ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.path.startsWith("/extensionDemo4")) {
          ctx.body = "Hallo Evgenij 9\n"; //+ moment().format('LLLL') + "\n" + moment().format('LTS');
        } else {
          return next();
        }
      });
    },
    detach: (logger: Logger) => {
      logger.info("Detaching example extension.");
    },
  };
};
