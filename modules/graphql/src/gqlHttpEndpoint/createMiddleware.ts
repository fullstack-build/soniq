/* eslint-disable require-atomic-updates */
import {
  Source,
  execute as graphqlExecute,
  parse,
  specifiedRules,
  validate,
  GraphQLSchema,
  ValidationRule,
  formatError,
  GraphQLError,
  getOperationAST,
  OperationDefinitionNode,
  ExecutionResult,
  DocumentNode,
} from "graphql";
import * as createHttpError from "http-errors";
import * as isObject from "isobject";
import { Koa } from "@soniq/server";
import * as koaBodyParser from "koa-bodyparser";
import * as koaJson from "koa-json";
import * as compose from "koa-compose";
import { NoIntrospection } from "./noIntrospectionValidationRule";
import { AuthenticationError, ForbiddenError, UserInputError, InternalServerError } from "../GraphqlErrors";
import { Maybe } from "@graphql-tools/utils";
import * as _ from "lodash";
import { Logger } from "soniq";

export function createGqlMiddleware(schema: GraphQLSchema, disableIntrospection: boolean): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = ctx.request as any;

    if (ctx.request.method !== "GET" && ctx.request.method !== "POST") {
      throw createHttpError(405, "GraphQL only supports GET and POST requests.", {
        headers: { Allow: "GET, POST" },
      });
    }

    if (typeof req.body === "undefined") {
      throw createHttpError(400, "Request body missing.");
    }

    if (!isObject(req.body)) {
      throw createHttpError(400, "Request body must be a JSON object.");
    }

    if (!("query" in req.body)) {
      throw createHttpError(400, "GraphQL operation field `query` missing.");
    }

    if (typeof req.body.query !== "string") {
      throw createHttpError(400, "GraphQL operation field `query` must be a string.");
    }

    if ("variables" in req.body && req.body.variables != null && !isObject(req.body.variables)) {
      throw createHttpError(400, "Request body JSON `variables` field must be an object.");
    }

    let document: DocumentNode;

    try {
      document = parse(new Source(req.body.query));
    } catch (error) {
      ctx.body = {
        errors: [error],
      };
      ctx.status = 400;
      return;
    }

    const customRules: ValidationRule[] = [];

    if (disableIntrospection === true) {
      customRules.push(NoIntrospection);
    }

    // eslint-disable-next-line @typescript-eslint/typedef
    const queryValidationErrors = validate(schema, document, [...specifiedRules, ...customRules]);

    if (queryValidationErrors.length) {
      ctx.body = {
        errors: queryValidationErrors,
      };
      ctx.status = 400;
      return;
    }

    if (req.method === "GET") {
      // Determine if this GET request will perform a non-query.
      const operationAST: Maybe<OperationDefinitionNode> = getOperationAST(document, req.body.operationName);
      if (operationAST && operationAST.operation !== "query") {
        throw createHttpError(405, `Can only perform a ${operationAST.operation} operation from a POST request.`, {
          headers: { Allow: "POST" },
        });
      }
    }

    const gqlExecutionResult: ExecutionResult = await graphqlExecute({
      schema: schema,
      contextValue: {
        ctx,
        accessToken: ctx.state.accessToken,
      },
      document,
      variableValues: req.body.variables,
      operationName: req.body.operationName,
    });

    ctx.body = gqlExecutionResult;

    // Set the content-type.
    ctx.response.type = "application/graphql+json";

    await next();
  };
}

function setCacheHeaders(): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
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

function formatGqlErrors(dangerouslyExposeErrorDetails: boolean, logger: Logger): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    await next();

    if (ctx.body.errors != null) {
      ctx.body.errors = ctx.body.errors.map((err: GraphQLError) => {
        if (_.get(err, "extensions.hideDetails") === true) {
          if (dangerouslyExposeErrorDetails !== true) {
            return formatError(new InternalServerError());
          }
        }
        const hideDetails: boolean = _.get(err, "extensions.hideDetails") === true;

        if (err.message.startsWith("AUTH.THROW.AUTHENTICATION_ERROR")) {
          if (err.message.startsWith("AUTH.THROW.AUTHENTICATION_ERROR: ")) {
            err.message = err.message.substr("AUTH.THROW.AUTHENTICATION_ERROR: ".length);
          } else {
            err.message = "Authentication required";
          }
          const formattedError: AuthenticationError = new AuthenticationError(err.message, hideDetails);
          formattedError.path = err.path;
          formattedError.locations = err.locations;
          return formatError(formattedError);
        }
        if (err.message.startsWith("AUTH.THROW.FORBIDDEN_ERROR")) {
          if (err.message.startsWith("AUTH.THROW.FORBIDDEN_ERROR: ")) {
            err.message = err.message.substr("AUTH.THROW.FORBIDDEN_ERROR: ".length);
          } else {
            err.message = "Access denied";
          }
          const formattedError: ForbiddenError = new ForbiddenError(err.message, hideDetails);
          formattedError.path = err.path;
          formattedError.locations = err.locations;
          return formatError(formattedError);
        }
        if (err.message.startsWith("AUTH.THROW.USER_INPUT_ERROR")) {
          if (err.message.startsWith("AUTH.THROW.USER_INPUT_ERROR: ")) {
            err.message = err.message.substr("AUTH.THROW.USER_INPUT_ERROR: ".length);
          } else {
            err.message = "Bad user input";
          }
          const formattedError: UserInputError = new UserInputError(err.message, hideDetails);
          formattedError.path = err.path;
          formattedError.locations = err.locations;
          return formatError(formattedError);
        }

        const code: string | null = _.get(err, "extensions.code");
        const validCodes: string[] = ["INTERNAL_SERVER_ERROR", "BAD_USER_INPUT", "FORBIDDEN", "UNAUTHENTICATED"];

        if (code != null && validCodes.indexOf(code) >= 0) {
          return formatError(err);
        } else {
          logger.error("Unkown error occured", err);
          return formatError(new InternalServerError());
        }
      });
    }
  };
}

function enforceOriginMatch(): Koa.Middleware {
  return (ctx: Koa.Context, next: Koa.Next) => {
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

export function createMiddleware(
  schema: GraphQLSchema,
  disableIntrospection: boolean,
  dangerouslyExposeErrorDetails: boolean,
  logger: Logger
): Koa.Middleware {
  const middlewares: Koa.Middleware[] = [];

  middlewares.push(setCacheHeaders());
  middlewares.push(enforceOriginMatch());
  middlewares.push(koaJson());
  middlewares.push(koaBodyParser());
  middlewares.push(formatGqlErrors(dangerouslyExposeErrorDetails, logger));
  middlewares.push(createGqlMiddleware(schema, disableIntrospection));

  return compose(middlewares);
}
