import { GraphQLSchema, GraphQLError, GraphQLFormattedError } from "graphql";
import { ApolloServer, gql, Config, ApolloError, UserInputError, AuthenticationError, ForbiddenError, ValidationError } from "apollo-server-koa";
import * as _ from "lodash";

import IGraphQlConfig from "./IGraphQlConfig";
import { ILogger } from "@fullstack-one/logger";
import { Koa } from "@fullstack-one/server";
import { TGetModuleRuntimeConfig, Pool } from "@fullstack-one/core";
import { IRuntimeConfigGql } from "./RuntimeInterfaces";
import getDefaultResolvers from "./getDefaultResolvers";
import { getResolvers, ICustomResolverObject } from "./resolverTransactions";
import { makeExecutableSchema } from "graphql-tools";
import { HookManager } from "./hooks";
import { OperatorsBuilder } from "./logicalOperators";
const compose = require('koa-compose');

function match (path) {
  // does not match prefix at all
  if (path.indexOf("/") !== 0) return false

  const newPath = path.replace("/", '') || '/'
  return newPath
}

export async function applyApolloMiddleware(
  app: Koa,
  getRuntimeConfig: TGetModuleRuntimeConfig,
  pgPool: Pool,
  diResolvers: ICustomResolverObject,
  config: IGraphQlConfig,
  logger: ILogger,
  hookManager: HookManager,
  operatorsBuilder: OperatorsBuilder
): Promise<void> {
  app.use(async (ctx, upstream) => {
    const runtimeConfig: IRuntimeConfigGql = await getRuntimeConfig();
    const schema = await makeSchema(runtimeConfig, diResolvers, pgPool, hookManager, logger, operatorsBuilder);
    const server = createApolloServer(schema, runtimeConfig, logger);
    const path = config.endpoint;

    const gqlApp = new Koa();

    gqlApp.use(enforceOriginMatch(path));
    gqlApp.use(setCacheHeaders(path));
    /* gqlApp.use(async (ctx, next) => {
      const runtimeConfig: IRuntimeConfigGql = await getRuntimeConfig();
      const newSchema = await makeSchema(runtimeConfig, diResolvers, pgPool, hookManager, logger, operatorsBuilder);

      const newServer = createApolloServer(newSchema, runtimeConfig, logger);

      _.set(server, "schema", _.get(newServer, "schema"));

      await next();
    });*/

    server.applyMiddleware({ app: gqlApp, path });

    return await gqlApp.handleRequest(ctx, compose(gqlApp.middleware));
  });
}

async function makeSchema(
  runtimeConfig: IRuntimeConfigGql,
  diResolvers: ICustomResolverObject,
  pgPool: Pool,
  hookManager: HookManager,
  logger: ILogger,
  operatorsBuilder: OperatorsBuilder
) {
  const defaultResolvers = getDefaultResolvers(operatorsBuilder, runtimeConfig.defaultResolverMeta, hookManager, pgPool, logger);

  const runtimeResolvers = { ...defaultResolvers, ...diResolvers };

  const resolvers = getResolvers(runtimeConfig.resolvers, runtimeResolvers, pgPool, logger);
  return makeExecutableSchema({ typeDefs: runtimeConfig.gqlTypeDefs, resolvers });
}

function createApolloServer(schema: GraphQLSchema, runtimeConfig: IRuntimeConfigGql, logger: ILogger): ApolloServer {
  const koaGraphQlConfig = getKoaGraphQLOptionsFunction(schema, logger);

  koaGraphQlConfig.playground = runtimeConfig.defaultResolverMeta.playgroundActive;
  koaGraphQlConfig.introspection = runtimeConfig.defaultResolverMeta.introspectionActive;

  const server = new ApolloServer(koaGraphQlConfig);

  return server;
}

function setCacheHeaders(path) {
  return async (ctx: any, next: () => any) => {
    if (ctx.request.path.startsWith(path) !== true) {
      return next();
    }
    await next();
    let cacheHeader = "no-store";
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

function enforceOriginMatch(path) {
  return (ctx: any, next: () => any) => {
    if (ctx.request.path.startsWith(path) !== true) {
      return next();
    }
    const errorMessage = "All graphql endpoints only allow requests with origin and referrer headers or API-Client requests from non-browsers.";

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

    if (ctx.securityContext.sameOriginApproved.byOrigin === true || ctx.securityContext.sameOriginApproved.byReferrer === true) {
      return next();
    }

    return ctx.throw(400, errorMessage);
  };
}

function getKoaGraphQLOptionsFunction(schema: GraphQLSchema, logger: ILogger): Config {
  return {
    schema,
    context: ({ ctx }) => {
      ctx.state.authRequired = false;
      ctx.state.includesMutation = false;

      return {
        ctx,
        accessToken: ctx.state.accessToken
      };
    },
    formatError: getFormatErrorFunction(logger)
  };
}

function getFormatErrorFunction(logger: ILogger): (error: GraphQLError) => GraphQLFormattedError {
  return (error: any) => {
    const errorCode = _.get(error, "extensions.code");
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
        const exception = _.get(error, "extensions.exception", {});
        error.extensions.exception = {
          message: exception.message,
          detail: exception.detail != null && exception.detail.indexOf("LINE") < 0 ? exception.detail : null,
          hint: exception.hint,
          schema: exception.schema,
          table: exception.table,
          column: exception.column,
          constraint: exception.constraint
        };
      }
      return error;
    }

    // tslint:disable-next-line:variable-name
    const handleGenericError = (ErrorClass: any, message: any) => {
      logger.trace(error);

      if (_.get(error, "extensions.hideDetails") === true || _.get(error, "extensions.exception.hideDetails") === true) {
        return new ErrorClass(message);
      }
      // Always hide the stacktrace. There is no reason to send it.
      _.set(error, "extensions.exception.stacktrace", null);

      // Mask pg-errors
      if (_.get(error, "extensions.exception.name", null) === "QueryFailedError") {
        const exception = _.get(error, "extensions.exception", {});
        error.extensions.exception = {
          message: exception.message,
          detail: exception.detail != null && exception.detail.indexOf("LINE") < 0 ? exception.detail : null,
          hint: exception.hint,
          schema: exception.schema,
          table: exception.table,
          column: exception.column,
          constraint: exception.constraint
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
