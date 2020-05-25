import { Service, Inject } from "soniq";
import { GraphQl, ReturnIdHandler, ICustomResolverObject } from "@soniq/graphql";
import { Auth, AuthProvider, IAuthFactorForProof } from "../index";

const schema: string = `
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
  info?: string | null;
}

@Service()
export class AuthProviderEmail {
  private _authProvider: AuthProvider;
  private _sendMail: ((mail: IProofMailPayload) => void) | null = null;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@Inject((type) => GraphQl) graphQl: GraphQl, @Inject((type) => Auth) auth: Auth) {
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

    this._authProvider = auth.createAuthProvider("email", 60 * 60 * 24);
  }

  private async _createEmail(email: string): Promise<string> {
    return this._authProvider.create(email, email, false, { email });
  }

  private async _initiateEmailProof(userIdentifier: string, info: string | undefined = undefined): Promise<unknown> {
    return this._authProvider.getAuthQueryHelper().transaction(async (pgClient) => {
      let currentAuthFactor: IAuthFactorForProof | null = null;

      const authFactorProofToken: string = (
        await this._authProvider.proof(pgClient, userIdentifier, async (authFactor: IAuthFactorForProof) => {
          currentAuthFactor = authFactor;

          return authFactor.communicationAddress;
        })
      ).authFactorProofToken;

      const authFactor: IAuthFactorForProof | null =
        currentAuthFactor != null ? (currentAuthFactor as IAuthFactorForProof) : null;

      if (authFactor != null && authFactor.communicationAddress != null) {
        const proofMailPayload: IProofMailPayload = {
          email: authFactor.communicationAddress,
          authFactorProofToken,
          userId: authFactor.userId,
          userAuthenticationId: authFactor.userAuthenticationId,
          info,
        };

        if (this._sendMail) {
          this._sendMail(proofMailPayload);
        }
      }
    });
  }

  /* private async callAndHideErrorDetails(callback: any) {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  } */

  private _getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/auth/EmailProvider/Mutation/createEmail": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            const token: string = await this._createEmail(args.email);
            if (returnIdHandler.setReturnId(token)) {
              return "Token hidden due to returnId usage.";
            }
            return token;
          },
        };
      },
      "@fullstack-one/auth/EmailProvider/Mutation/initiateEmailProof": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            try {
              // Don't await this. because we want to make no hint to an attacker wether a user with this email exists or not
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this._initiateEmailProof(returnIdHandler.getReturnId(args.userIdentifier), args.info);
            } catch (err) {
              /* Ignore Error */
            }
            return true;
          },
        };
      },
    };
  }

  public registerSendMailCallback(callback: (mail: IProofMailPayload) => void): void {
    if (this._sendMail != null) {
      throw new Error("EmailAuthProvider 'registerSendMailCallback' can only be called once.");
    }
    this._sendMail = callback;
  }
}
