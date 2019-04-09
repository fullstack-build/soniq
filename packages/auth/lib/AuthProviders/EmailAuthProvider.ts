import { Service, Inject } from "@fullstack-one/di";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { GraphQl } from "@fullstack-one/graphql";
import { Auth, AuthProvider, IAuthFactorForProof } from "..";

const schema = `
extend type Mutation {
    """
  Find a user by username and tenant, returning two encrypted uuids to identify the user
  This will never fail. When the user could not be found it will return fake-data.
  """
  createEmail(email: String!): String @custom(resolver: "@fullstack-one/auth/EmailProvider/createEmail")

  """
  Login a user. Get back an accessToken and metadata about it.
  """
  initiateEmailProof(userIdentifier: String!, info: String): Boolean @custom(resolver: "@fullstack-one/auth/EmailProvider/initiateEmailProof")
}
`;

export interface IProofMailPayload {
  email: string;
  authFactorProofToken: string;
  userId: string;
  userAuthenticationId: string;
}

@Service()
export class EmailAuthProvider {
  private authProvider: AuthProvider;
  private sendMail: (mail: IProofMailPayload) => void;

  constructor(
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => Auth) auth: Auth
  ) {
    schemaBuilder.extendSchema(schema);
    graphQl.addResolvers(this.getResolvers());

    this.authProvider = auth.createAuthProvider("email", 60 * 60 * 24);
  }

  private async createEmail(email: string) {
    return this.authProvider.create(email, email, false, { email });
  }

  private async initiateEmailProof(userIdentifier: string, info: string = null): Promise<void> {
    let currentAuthFactor: IAuthFactorForProof;

    const authFactorProofToken = (await this.authProvider.proof(userIdentifier, async (authFactor: IAuthFactorForProof) => {
      currentAuthFactor = authFactor;

      return authFactor.communicationAddress;
    })).authFactorProofToken;

    if (currentAuthFactor != null && currentAuthFactor.communicationAddress != null) {
      const proofMailPayload: IProofMailPayload = {
        email: currentAuthFactor.communicationAddress,
        authFactorProofToken,
        userId: currentAuthFactor.userId,
        userAuthenticationId: currentAuthFactor.userAuthenticationId
      };

      this.sendMail(proofMailPayload);
    }
  }

  private getResolvers() {
    return {
      "@fullstack-one/auth/EmailProvider/createEmail": async (obj, args, context, info, params) => {
        return this.createEmail(args.email);
      },
      "@fullstack-one/auth/EmailProvider/initiateEmailProof": async (obj, args, context, info, params) => {
        try {
          // Don't await this.
          this.initiateEmailProof(args.userIdentifier, args.info);
        } catch (err) {
          /* Ignore Error */
        }
        return true;
      }
    };
  }

  public registerSendMailCallback(callback: (mail: IProofMailPayload) => void) {
    if (this.sendMail != null) {
      throw new Error("EmailAuthProvider 'registerSendMailCallback' can only be called once.");
    }
    this.sendMail = callback;
  }
}
