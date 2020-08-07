/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
import { GraphQLError } from "graphql";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IErrorExtensions = Record<string, any>;

class UserInputError extends Error implements GraphQLError {
  public extensions: Record<string, any>;
  public name: any;
  public locations: any;
  public path: any;
  public source: any;
  public positions: any;
  public nodes: any;
  public originalError: any;

  public constructor(message: string, hideDetails?: boolean, extensions?: IErrorExtensions) {
    super(message);

    this.extensions = {
      code: "BAD_USER_INPUT",
      ...(extensions || {}),
    };

    this.extensions.code = "BAD_USER_INPUT";

    if (hideDetails === true) {
      this.extensions.hideDetails = true;
      this.extensions._warning = "This error will be hidden in production.";
    }
  }
}

class AuthenticationError extends Error implements GraphQLError {
  public extensions: Record<string, any>;
  public name: any;
  public locations: any;
  public path: any;
  public source: any;
  public positions: any;
  public nodes: any;
  public originalError: any;

  public constructor(message: string, hideDetails?: boolean) {
    super(message);

    this.extensions = {
      code: "UNAUTHENTICATED",
    };

    if (hideDetails === true) {
      this.extensions.hideDetails = true;
      this.extensions._warning = "This error will be hidden in production.";
    }
  }
}

class ForbiddenError extends Error implements GraphQLError {
  public extensions: Record<string, any>;
  public name: any;
  public locations: any;
  public path: any;
  public source: any;
  public positions: any;
  public nodes: any;
  public originalError: any;

  public constructor(message: string, hideDetails?: boolean) {
    super(message);

    this.extensions = {
      code: "FORBIDDEN",
    };

    if (hideDetails === true) {
      this.extensions.hideDetails = true;
      this.extensions._warning = "This error will be hidden in production.";
    }
  }
}

class InternalServerError extends Error implements GraphQLError {
  public extensions: Record<string, any>;
  public name: any;
  public locations: any;
  public path: any;
  public source: any;
  public positions: any;
  public nodes: any;
  public originalError: any;

  public constructor() {
    super("Internal server error");

    this.extensions = {
      code: "INTERNAL_SERVER_ERROR",
    };
  }
}

export { AuthenticationError, ForbiddenError, UserInputError, InternalServerError };
