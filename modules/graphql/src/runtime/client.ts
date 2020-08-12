import { GraphQl } from "..";
import {
  execute,
  FormattedExecutionResult,
  DocumentNode,
  Source,
  parse,
  specifiedRules,
  validate,
  ExecutionResult,
} from "graphql";
import { formatErrors } from "./formatErrors";
import { PoolClient } from "soniq";

export interface IQueryOptions {
  variables?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    pgClient?: PoolClient;
    accessToken?: string;
  };
  operationName?: string;
}

export class GraphQlClient {
  private _graphQl: GraphQl;

  public constructor(graphQl: GraphQl) {
    this._graphQl = graphQl;
  }

  public async query(query: string, options: IQueryOptions): Promise<FormattedExecutionResult> {
    let document: DocumentNode;

    try {
      document = parse(new Source(query));
    } catch (error) {
      return {
        errors: [error],
      };
    }

    const { schema, runtimeConfig } = await this._graphQl.getSchema("GQL_CLIENT");

    // eslint-disable-next-line @typescript-eslint/typedef
    const queryValidationErrors = validate(schema, document, [...specifiedRules]);

    if (queryValidationErrors.length) {
      return {
        errors: queryValidationErrors,
      };
    }

    const gqlExecutionResult: ExecutionResult = await execute({
      schema: schema,
      contextValue: options.context || {},
      document,
      variableValues: options.variables,
      operationName: options.operationName,
    });

    return formatErrors(
      gqlExecutionResult,
      runtimeConfig.options.dangerouslyExposeErrorDetails === true,
      this._graphQl.getLogger()
    );
  }
}
