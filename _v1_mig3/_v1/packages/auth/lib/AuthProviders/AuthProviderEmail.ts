import { Service, Inject } from "@fullstack-one/di";
// import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { GraphQl, ReturnIdHandler, ICustomResolverObject } from "@fullstack-one/graphql";
import { Auth, AuthProvider, IAuthFactorForProof } from "..";
import * as _ from "lodash";

const schema = `
extend type Mutation {
  """
  Creates a new email AuthFactorCreationToken for the given email-address.
  """
  createEmail(email: String!, returnId: String): String!

  """
  This will send an AuthFactorProofToken via mail to the user if the user exists and has an email-address.
  This will never fail.
  """
  initiateEmailProof(userIdentifier: String!, info: String): Boolean
}
`;

export interface IProofMailPayload {
  email: string;
  authFactorProofToken: string;
  userId: string;
  userAuthenticationId: string;
  info: string;
}

@Service()
export class AuthProviderEmail {
  private authProvider: AuthProvider;
  private sendMail: (mail: IProofMailPayload) => void;

  constructor(@Inject((type) => GraphQl) graphQl: GraphQl, @Inject((type) => Auth) auth: Auth) {
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

    this.authProvider = auth.createAuthProvider("email", 60 * 60 * 24);
  }

  private async createEmail(email: string) {
    return this.authProvider.create(email.toLowerCase(), email.toLowerCase(), false, { email: email.toLowerCase() });
  }

  private async initiateEmailProof(userIdentifier: string, info: string = null): Promise<void> {
    this.authProvider.getAuthQueryHelper().transaction(async (pgClient) => {
      let currentAuthFactor: IAuthFactorForProof;

      const authFactorProofToken = (await this.authProvider.proof(pgClient, userIdentifier, async (authFactor: IAuthFactorForProof) => {
        currentAuthFactor = authFactor;

        return authFactor.communicationAddress;
      })).authFactorProofToken;

      if (currentAuthFactor != null && currentAuthFactor.communicationAddress != null) {
        const proofMailPayload: IProofMailPayload = {
          email: currentAuthFactor.communicationAddress,
          authFactorProofToken,
          userId: currentAuthFactor.userId,
          userAuthenticationId: currentAuthFactor.userAuthenticationId,
          info
        };

        this.sendMail(proofMailPayload);
      }
    });
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
      "@fullstack-one/auth/EmailProvider/Mutation/createEmail": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            const token = await this.createEmail(args.email);
            if (returnIdHandler.setReturnId(token)) {
              return "Token hidden due to returnId usage.";
            }
            return token;
          }
        };
      },
      "@fullstack-one/auth/EmailProvider/Mutation/initiateEmailProof": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            try {
              // Don't await this. because we want to make no hint to an attacker wether a user with this email exists or not
              this.initiateEmailProof(returnIdHandler.getReturnId(args.userIdentifier), args.info);
            } catch (err) {
              /* Ignore Error */
            }
            return true;
          }
        };
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
