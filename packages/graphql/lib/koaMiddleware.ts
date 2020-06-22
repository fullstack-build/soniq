import { GraphQLSchema, GraphQLError, GraphQLFormattedError } from "graphql";
import { ApolloServer, gql, Config, ApolloError, UserInputError, AuthenticationError, ForbiddenError, ValidationError } from "apollo-server-koa";
import * as _ from "lodash";

import IGraphQlConfig from "./IGraphQlConfig";
import { Logger } from "@fullstack-one/logger";
import { Koa } from "@fullstack-one/server";

export function applyApolloMiddleware(app: Koa, schema: GraphQLSchema, config: IGraphQlConfig, logger: Logger) {
  const server = createApolloServer(schema, config, logger);
  const path = config.endpoint;

  app.use(enforceOriginMatch(path));
  app.use(setCacheHeaders(path));

  server.applyMiddleware({ app, path });
}

function createApolloServer(schema: GraphQLSchema, { graphiQlEndpointActive }: IGraphQlConfig, logger: Logger): ApolloServer {
  const koaGraphQlConfig = getKoaGraphQLOptionsFunction(schema, logger);

  koaGraphQlConfig.playground = graphiQlEndpointActive === true;

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

function getKoaGraphQLOptionsFunction(schema: GraphQLSchema, logger: Logger): Config {
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

function getFormatErrorFunction(logger: Logger): (error: GraphQLError) => GraphQLFormattedError {
  return (error: any) => {
    const errorCode = _.get(error, "extensions.code");
    // If any Error has a exposeDetails flag just return it to the user
    if (
      (errorCode === "BAD_USER_INPUT" || errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") &&
      (_.get(error, "extensions.exposeDetails") === true || _.get(error, "extensions.exception.exposeDetails") === true)
    ) {
      logger.debug(error);
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
      logger.debug(error);

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
      logger.info(error);
      return new UserInputError("Bad user input.");
    }
    if (error.message.indexOf("AUTH.THROW.AUTHENTICATION_ERROR") >= 0) {
      logger.info(error);
      return new AuthenticationError("Authentication required.");
    }
    if (error.message.indexOf("AUTH.THROW.FORBIDDEN_ERROR") >= 0) {
      logger.info(error);
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
