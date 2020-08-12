import { ExecutionResult, GraphQLError, formatError, GraphQLFormattedError, FormattedExecutionResult } from "graphql";
import { Logger } from "soniq";
import { InternalServerError, AuthenticationError, ForbiddenError, UserInputError } from "../GraphqlErrors";
import * as _ from "lodash";

export function formatErrors(
  result: ExecutionResult,
  dangerouslyExposeErrorDetails: boolean,
  logger: Logger
): FormattedExecutionResult {
  if (result.errors != null) {
    const errors: GraphQLFormattedError[] = result.errors.map((err: GraphQLError) => {
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
    return {
      ...result,
      errors,
    };
  }
  return result;
}
