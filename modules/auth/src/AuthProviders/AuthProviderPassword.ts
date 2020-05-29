import { DI, PoolClient } from "soniq";
import { GraphQl, ReturnIdHandler, ICustomResolverObject } from "@soniq/graphql";
import { Auth, AuthProvider } from "../index";
import * as _ from "lodash";
import { IProofResponse } from "../interfaces";

const schema: string = `
extend type Mutation {
  """
  Creates a new password AuthFactorCreationToken for the given password.
  """
  createPassword(password: String!, returnId: String): String!

  """
  Creates an AuthFactorProofToken for the given user und password.
  This will never fail. When the user could not be found it will return fake-data.
  """
  proofPassword(userIdentifier: String!, password: String!, returnId: String): String!
}
`;

@DI.injectable()
export class AuthProviderPassword {
  private _authProvider: AuthProvider;

  public constructor(
    // @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @DI.inject(GraphQl) graphQl: GraphQl,
    @DI.inject(DI.delay(() => Auth)) auth: Auth
  ) {
    graphQl.addTypeDefsExtension(() => {
      return schema;
    });

    graphQl.addResolvers(this._getResolvers());

    Object.keys(this._getResolvers())
      .map((key) => {
        const splittedKey: string[] = key.split("/");

        return () => {
          return {
            path: `${splittedKey[3]}.${splittedKey[4]}`,
            key,
            config: {},
          };
        };
      })
      .forEach(graphQl.addResolverExtension.bind(graphQl));

    this._authProvider = auth.createAuthProvider("password");
  }

  private async _createPassword(password: string): Promise<string> {
    return this._authProvider.create(password, null, true, {});
  }

  private async _proofPassword(pgClient: PoolClient, userIdentifier: string, password: string): Promise<string> {
    const result: IProofResponse = await this._authProvider.proof(pgClient, userIdentifier, async () => {
      return password;
    });

    return result.authFactorProofToken;
  }

  private async _callAndHideErrorDetails(callback: Function): Promise<unknown> {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  }

  private _getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/auth/PasswordProvider/Mutation/createPassword": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const token: string = await this._createPassword(args.password);
              if (returnIdHandler.setReturnId(token)) {
                return "Token hidden due to returnId usage.";
              }
              return token;
            });
          },
        };
      },
      "@fullstack-one/auth/PasswordProvider/Mutation/proofPassword": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const token: string = await this._proofPassword(
                context._transactionPgClient,
                returnIdHandler.getReturnId(args.userIdentifier),
                args.password
              );
              if (returnIdHandler.setReturnId(token)) {
                return "Token hidden due to returnId usage.";
              }
              return token;
            });
          },
        };
      },
    };
  }
}
