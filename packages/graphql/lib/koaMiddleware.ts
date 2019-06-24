import { GraphQLSchema, GraphQLError, GraphQLFormattedError } from "graphql";
import { ApolloServer, gql, Config, ApolloError, UserInputError, AuthenticationError, ForbiddenError } from "apollo-server-koa";
import * as _ from "lodash";

import IGraphQlConfig from "./IGraphQlConfig";
import { ILogger } from "@fullstack-one/logger";
import { Koa } from "@fullstack-one/server";

export function applyApolloMiddleware(app: Koa, schema: GraphQLSchema, config: IGraphQlConfig, logger: ILogger) {
  const server = createApolloServer(schema, config, logger);
  const path = config.endpoint;

  app.use(enforceOriginMatch(path));
  app.use(setCacheHeaders(path));

  server.applyMiddleware({ app, path });
}

function createApolloServer(schema: GraphQLSchema, { graphiQlEndpointActive }: IGraphQlConfig, logger: ILogger): ApolloServer {
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
  return (error: GraphQLError) => {
    // log all errors here!
    logger.error(error);
    // tslint:disable-next-line:no-console TODO: Logger should log the stacktrace of the given error, not the one where it is called
    console.error("->", JSON.stringify(error, null, 2));

    // If any Error has a exposeDetails flag just return it to the user
    if (_.get(error, "extensions.exposeDetails") === true) {
      _.set(error, "extensions.exception", null);
      return error;
    }

    // For Apollo predefined errors keep the type but hide all details.
    if (_.get(error, "extensions.code") === "BAD_USER_INPUT") {
      return new UserInputError("Bad user input.");
    }
    if (_.get(error, "extensions.code") === "UNAUTHENTICATED") {
      return new AuthenticationError("Authentication required.");
    }
    if (_.get(error, "extensions.code") === "FORBIDDEN") {
      return new ForbiddenError("Access forbidden.");
    }

    // Try to map other errors to Apollo predefined errors.
    if (error.message.indexOf("AUTH.THROW.USER_INPUT_ERROR") >= 0) {
      return new UserInputError("Bad user input.");
    }
    if (error.message.indexOf("AUTH.THROW.AUTHENTICATION_ERROR") >= 0) {
      return new AuthenticationError("Authentication required.");
    }
    if (error.message.indexOf("AUTH.THROW.FORBIDDEN_ERROR") >= 0) {
      return new ForbiddenError("Access forbidden.");
    }

    // For all other errors just return a Internal server error
    return new ApolloError("Internal server error", "INTERNAL_SERVER_ERROR");
  };
}
