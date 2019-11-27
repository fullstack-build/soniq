import { Service, Inject } from "@fullstack-one/di";
// import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { GraphQl, ReturnIdHandler, ICustomResolverObject } from "@fullstack-one/graphql";
import { Auth, AuthProvider } from "..";
// import { PostgresQueryRunner } from "@fullstack-one/db";
import * as _ from "lodash";

const schema = `
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

@Service()
export class AuthProviderPassword {
  private authProvider: AuthProvider;

  constructor(
    // @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => Auth) auth: Auth
  ) {
    graphQl.addTypeDefsExtension(() => {
      return schema;
    });

    graphQl.addResolvers(this.getResolvers());

    Object.keys(this.getResolvers())
      .map((key) => {
        const splittedKey = key.split("/");

        return () => {
          return {
            path: `${splittedKey[3]}.${splittedKey[4]}`,
            key,
            config: {}
          };
        };
      })
      .forEach(graphQl.addResolverExtension.bind(graphQl));

    this.authProvider = auth.createAuthProvider("password");
  }

  private async createPassword(password: string) {
    return this.authProvider.create(password, null, true, {});
  }

  private async proofPassword(queryRunner: any, userIdentifier: string, password: string): Promise<string> {
    const result = await this.authProvider.proof(queryRunner, userIdentifier, async () => {
      return password;
    });

    return result.authFactorProofToken;
  }

  private async callAndHideErrorDetails(callback) {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  }

  private getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/auth/PasswordProvider/Mutation/createPassword": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const token = await this.createPassword(args.password);
              if (returnIdHandler.setReturnId(token)) {
                return "Token hidden due to returnId usage.";
              }
              return token;
            });
          }
        };
      },
      "@fullstack-one/auth/PasswordProvider/Mutation/proofPassword": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const token = await this.proofPassword(context._transactionPgClient, returnIdHandler.getReturnId(args.userIdentifier), args.password);
              if (returnIdHandler.setReturnId(token)) {
                return "Token hidden due to returnId usage.";
              }
              return token;
            });
          }
        };
      }
    };
  }
}
