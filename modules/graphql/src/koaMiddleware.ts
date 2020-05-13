/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-atomic-updates */
import { GraphQLSchema, GraphQLError, GraphQLFormattedError } from "graphql";
import {
  ApolloServer,
  Config,
  ApolloError,
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
} from "apollo-server-koa";
import * as _ from "lodash";

import IGraphQlConfig from "./IGraphQlConfig";
import { Logger } from "soniq";
import { Koa } from "@soniq/server";
import { TGetModuleRuntimeConfig, Pool } from "soniq";
import { IRuntimeConfigGql } from "./RuntimeInterfaces";
import getDefaultResolvers from "./getDefaultResolvers";
import { getResolvers, ICustomResolverObject, ICustomResolverCreator } from "./resolverTransactions";
import { makeExecutableSchema, IResolvers } from "graphql-tools";
import { HookManager } from "./hooks";
import { OperatorsBuilder } from "./logicalOperators";
import * as compose from "koa-compose";

/* function match(path: string): string | false {
  // does not match prefix at all
  if (path.indexOf("/") !== 0) return false

  const newPath = path.replace("/", '') || '/'
  return newPath
} */

async function makeSchema(
  runtimeConfig: IRuntimeConfigGql,
  diResolvers: ICustomResolverObject,
  pgPool: Pool,
  hookManager: HookManager,
  logger: Logger,
  operatorsBuilder: OperatorsBuilder
): Promise<GraphQLSchema> {
  const defaultResolvers: ICustomResolverObject = getDefaultResolvers(
    operatorsBuilder,
    runtimeConfig.defaultResolverMeta,
    hookManager,
    pgPool,
    logger
  );

  const runtimeResolvers: {
    [x: string]: ICustomResolverCreator;
  } = { ...defaultResolvers, ...diResolvers };

  const resolvers: IResolvers<any, any> = getResolvers(runtimeConfig.resolvers, runtimeResolvers, pgPool, logger);
  return makeExecutableSchema({
    typeDefs: runtimeConfig.gqlTypeDefs,
    resolvers,
  });
}

function getFormatErrorFunction(logger: Logger): (error: GraphQLError) => GraphQLFormattedError {
  return (error: any) => {
    const errorCode: string = _.get(error, "extensions.code");
    // If any Error has a exposeDetails flag just return it to the user
    if (
      (errorCode === "BAD_USER_INPUT" || errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") &&
      (_.get(error, "extensions.exposeDetails") === true || _.get(error, "extensions.exception.exposeDetails") === true)
    ) {
      logger.trace(error);
      // Always hide the stacktrace. There is no reason to send it.
      _.set(error, "extensions.exception.stacktrace", null);

      // Mask pg-errors
      if (_.get(error, "extensions.exception.name", null) === "QueryFailedError") {
        const exception: any = _.get(error, "extensions.exception", {});
        error.extensions.exception = {
          message: exception.message,
          detail: exception.detail != null && exception.detail.indexOf("LINE") < 0 ? exception.detail : null,
          hint: exception.hint,
          schema: exception.schema,
          table: exception.table,
          column: exception.column,
          constraint: exception.constraint,
        };
      }
      return error;
    }

    // tslint:disable-next-line:variable-name
    const handleGenericError: (ErrorClass: any, message: any) => any = (ErrorClass: any, message: any) => {
      logger.trace(error);

      if (
        _.get(error, "extensions.hideDetails") === true ||
        _.get(error, "extensions.exception.hideDetails") === true
      ) {
        return new ErrorClass(message);
      }
      // Always hide the stacktrace. There is no reason to send it.
      _.set(error, "extensions.exception.stacktrace", null);

      // Mask pg-errors
      if (_.get(error, "extensions.exception.name", null) === "QueryFailedError") {
        const exception: any = _.get(error, "extensions.exception", {});
        error.extensions.exception = {
          message: exception.message,
          detail: exception.detail != null && exception.detail.indexOf("LINE") < 0 ? exception.detail : null,
          hint: exception.hint,
          schema: exception.schema,
          table: exception.table,
          column: exception.column,
          constraint: exception.constraint,
        };
      }
      return error;
    };
    if (_.get(error, "name", null) === "ValidationError") {
      return handleGenericError(ValidationError, "ValidationError: Details hidden.");
    }
    if (_.get(error, "name", null) === "UserInputError") {
      return handleGenericError(UserInputError, "UserInputError: Details hidden.");
    }
    if (_.get(error, "name", null) === "AuthenticationError") {
      return handleGenericError(AuthenticationError, "AuthenticationError: Details hidden.");
    }
    if (_.get(error, "name", null) === "ForbiddenError") {
      return handleGenericError(ForbiddenError, "ForbiddenError: Details hidden.");
    }

    // Try to map other errors to Apollo predefined errors. Useful when writing pg-functions which cannot return a specific Error Object
    if (error.message.indexOf("AUTH.THROW.USER_INPUT_ERROR") >= 0) {
      logger.trace(error);
      return new UserInputError("Bad user input.");
    }
    if (error.message.indexOf("AUTH.THROW.AUTHENTICATION_ERROR") >= 0) {
      logger.trace(error);
      return new AuthenticationError("Authentication required.");
    }
    if (error.message.indexOf("AUTH.THROW.FORBIDDEN_ERROR") >= 0) {
      logger.trace(error);
      return new ForbiddenError("Access forbidden.");
    }

    if (_.get(error, "name", null) === "ApolloError") {
      return handleGenericError(ApolloError, "ApolloError: Details hidden.");
    }
    if (_.get(error, "name", null) === "GraphQLError") {
      return handleGenericError(GraphQLError, "GraphQLError: Details hidden.");
    }
    // Log all internal errors as error here => Everything else is just trace
    logger.error(error);

    // For all other errors just return a Internal server error
    return new ApolloError("Internal server error", "INTERNAL_SERVER_ERROR");
  };
}

function getKoaGraphQLOptionsFunction(schema: GraphQLSchema, logger: Logger): Config {
  return {
    schema,
    //@ts-ignore TODO: WTF?
    context: ({ ctx }) => {
      ctx.state.authRequired = false;
      ctx.state.includesMutation = false;

      return {
        ctx,
        accessToken: ctx.state.accessToken,
      };
    },
    formatError: getFormatErrorFunction(logger),
  };
}

function createApolloServer(schema: GraphQLSchema, runtimeConfig: IRuntimeConfigGql, logger: Logger): ApolloServer {
  const koaGraphQlConfig: any = getKoaGraphQLOptionsFunction(schema, logger);

  koaGraphQlConfig.playground = runtimeConfig.defaultResolverMeta.playgroundActive;
  koaGraphQlConfig.introspection = runtimeConfig.defaultResolverMeta.introspectionActive;

  //@ts-ignore
  const server: ApolloServer = new ApolloServer(koaGraphQlConfig);

  return server;
}

function setCacheHeaders(path: string): any {
  return async (ctx: any, next: () => any) => {
    if (ctx.request.path.startsWith(path) !== true) {
      return next();
    }
    await next();
    let cacheHeader: string = "no-store";
    if (ctx.state.includesMutation === true) {
      cacheHeader = "no-store";
    } else {
      if (ctx.state.authRequired === true) {
        cacheHeader = "privat, max-age=600";
      } else {
        cacheHeader = "public, max-age=600";
      }
    }

    ctx.set("Cache-Control", cacheHeader);
  };
}

function enforceOriginMatch(path: string): any {
  return (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.request.path.startsWith(path) !== true) {
      return next();
    }
    const errorMessage: string =
      "All graphql endpoints only allow requests with origin and referrer headers or API-Client requests from non-browsers.";

    if (ctx.securityContext == null) {
      return ctx.throw(400, errorMessage);
    }

    // If a user is requesting data through an API-Client (not a Browser) simply allow everything
    if (ctx.securityContext.isApiClient === true) {
      return next();
    }

    if (ctx.securityContext.requestMethod === "GET") {
      return next();
    }

    if (
      ctx.securityContext.sameOriginApproved.byOrigin === true ||
      ctx.securityContext.sameOriginApproved.byReferrer === true
    ) {
      return next();
    }

    return ctx.throw(400, errorMessage);
  };
}

export async function applyApolloMiddleware(
  app: Koa,
  getRuntimeConfig: TGetModuleRuntimeConfig,
  pgPool: Pool,
  diResolvers: ICustomResolverObject,
  config: IGraphQlConfig,
  logger: Logger,
  hookManager: HookManager,
  operatorsBuilder: OperatorsBuilder
): Promise<void> {
  let gqlApp: Koa | null;

  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    const { runtimeConfig, hasBeenUpdated } = await getRuntimeConfig("APOLLO"); // IRuntimeConfigGql

    if (gqlApp == null || hasBeenUpdated === true) {
      const schema: GraphQLSchema = await makeSchema(
        runtimeConfig,
        diResolvers,
        pgPool,
        hookManager,
        logger,
        operatorsBuilder
      );
      const server: ApolloServer = createApolloServer(schema, runtimeConfig, logger);
      const path: string = config.endpoint;

      gqlApp = null;
      gqlApp = new Koa();

      gqlApp.use(enforceOriginMatch(path));
      gqlApp.use(setCacheHeaders(path));

      server.applyMiddleware({ app: gqlApp, path });
    }

    //@ts-ignore TODO: @eugene gqlApp is always set because this is checked in the if-clause before
    return await gqlApp.handleRequest(ctx, compose(gqlApp.middleware));
  });
}
