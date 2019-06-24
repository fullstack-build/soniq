import { Service, Inject } from "@fullstack-one/di";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { GraphQl } from "@fullstack-one/graphql";
import { Auth, AuthProvider } from "..";

const schema = `
extend type Mutation {
  """
  Creates a new password AuthFactorCreationToken for the given password.
  """
  createPassword(password: String!, returnId: String): String! @custom(resolver: "@fullstack-one/auth/PasswordProvider/createPassword", usesQueryRunnerFromContext: true)

  """
  Creates an AuthFactorProofToken for the given user und password.
  This will never fail. When the user could not be found it will return fake-data.
  """
  proofPassword(userIdentifier: String!, password: String!, returnId: String): String! @custom(resolver: "@fullstack-one/auth/PasswordProvider/proofPassword", usesQueryRunnerFromContext: true)
}
`;

@Service()
export class AuthProviderPassword {
  private authProvider: AuthProvider;

  constructor(
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => Auth) auth: Auth
  ) {
    schemaBuilder.extendSchema(schema);
    graphQl.addResolvers(this.getResolvers());

    this.authProvider = auth.createAuthProvider("password");
  }

  private async createPassword(password: string) {
    return this.authProvider.create(password, null, true, {});
  }

  private async proofPassword(userIdentifier: string, password: string): Promise<string> {
    return (await this.authProvider.proof(userIdentifier, async () => {
      return password;
    })).authFactorProofToken;
  }

  private getResolvers() {
    return {
      "@fullstack-one/auth/PasswordProvider/createPassword": async (obj, args, context, info, params) => {
        return this.createPassword(args.password);
      },
      "@fullstack-one/auth/PasswordProvider/proofPassword": async (obj, args, context, info, params) => {
        return this.proofPassword(args.userIdentifier, args.password);
      }
    };
  }
}
