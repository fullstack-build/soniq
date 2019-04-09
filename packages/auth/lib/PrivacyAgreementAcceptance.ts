import { signJwt, verifyJwt } from "./signHelper";
import { ILogger } from "@fullstack-one/logger";
import { UserInputError } from "@fullstack-one/graphql";

export class PrivacyAgreementAcceptance {
  private authConfig;
  private parserMeta;
  private logger: ILogger;

  constructor(authConfig, parserMeta, logger: ILogger) {
    this.authConfig = authConfig;
    this.parserMeta = parserMeta;
    this.logger = logger;
  }

  public createPrivacyAgreementAcceptanceToken(acceptedVersion) {
    if (acceptedVersion !== this.authConfig.privacyAgreementAcceptance.versionToAccept) {
      const error = new UserInputError(`The accepted version is not version '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`);
      error.extensions.exposeDetails = true;
      throw error;
    }

    const acceptedAtInUTC = new Date().toISOString();

    const payload = {
      acceptedVersion,
      acceptedAtInUTC
    };

    const token = signJwt(
      this.authConfig.secrets.privacyAgreementAcceptanceToken,
      payload,
      this.authConfig.privacyAgreementAcceptance.tokenMaxAgeInSeconds
    );

    return {
      token,
      acceptedVersion,
      acceptedAtInUTC
    };
  }

  public isPrivacyAgreementCheckActive() {
    return this.parserMeta.privacyAgreementAcceptedAtInUTC != null && this.parserMeta.privacyAgreementAcceptedVersion != null;
  }

  public createAuthToken(privacyAgreementAcceptanceToken, email, providerName, profileId, tenant, profile) {
    this.validatePrivacyAgreementAcceptanceToken(privacyAgreementAcceptanceToken);
    const payload = {
      providerName,
      profileId,
      email,
      tenant: tenant || "default",
      profile
    };

    const response = {
      payload,
      token: signJwt(this.authConfig.secrets.authToken, payload, this.authConfig.authToken.maxAgeInSeconds)
    };

    return response;
  }

  public validatePrivacyAgreementAcceptanceToken(privacyAgreementAcceptanceToken) {
    if (this.isPrivacyAgreementCheckActive() === true && privacyAgreementAcceptanceToken !== true) {
      let tokenPayload;
      if (privacyAgreementAcceptanceToken == null) {
        this.logger.warn("validatePrivacyAgreementAcceptanceToken.error.missingPrivacyAgreementAcceptanceToken");
        const error = new UserInputError("PrivacyAgreementAcceptanceToken missing!");
        error.extensions.exposeDetails = true;
        throw error;
      }
      try {
        tokenPayload = verifyJwt(this.authConfig.secrets.privacyAgreementAcceptanceToken, privacyAgreementAcceptanceToken);
      } catch (e) {
        this.logger.warn("validatePrivacyAgreementAcceptanceToken.error.invalidPrivacyAgreementAcceptanceToken");
        const error = new UserInputError("PrivacyAgreementAcceptanceToken invalid!");
        error.extensions.exposeDetails = true;
        throw error;
      }
      if (tokenPayload.acceptedVersion !== this.authConfig.privacyAgreementAcceptance.versionToAccept) {
        const error = new UserInputError(
          "The accepted version of privacyAgreementAcceptanceToken " +
            `is not version '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`
        );
        error.extensions.exposeDetails = true;
        throw error;
      }
    }
  }

  public validateRegisterArguments(args) {
    if (this.isPrivacyAgreementCheckActive() === true) {
      const { privacyAgreementAcceptedAtInUTC, privacyAgreementAcceptedVersion } = this.parserMeta;
      let tokenPayload;
      if (args.input[privacyAgreementAcceptedAtInUTC] == null || args.input[privacyAgreementAcceptedVersion] == null) {
        const error = new UserInputError(
          `The privacy-fields ('${privacyAgreementAcceptedAtInUTC}', '${privacyAgreementAcceptedVersion}') are required for creating a user.`
        );
        error.extensions.exposeDetails = true;
        throw error;
      }
      if (args.privacyAgreementAcceptanceToken == null) {
        const error = new UserInputError("Missing privacyAgreementAcceptanceToken argument.");
        error.extensions.exposeDetails = true;
        throw error;
      }
      try {
        tokenPayload = verifyJwt(this.authConfig.secrets.privacyAgreementAcceptanceToken, args.privacyAgreementAcceptanceToken);
      } catch (e) {
        const error = new UserInputError("Invalid privacy token.");
        error.extensions.exposeDetails = true;
        throw error;
      }
      if (
        tokenPayload.acceptedAtInUTC !== args.input[privacyAgreementAcceptedAtInUTC] ||
        tokenPayload.acceptedVersion !== args.input[privacyAgreementAcceptedVersion]
      ) {
        const error = new UserInputError(
          `The privacy-fields ('${privacyAgreementAcceptedAtInUTC}', '${privacyAgreementAcceptedVersion}') must match the payload of the privacy-token.`
        );
        error.extensions.exposeDetails = true;
        throw error;
      }
      if (tokenPayload.acceptedVersion !== this.authConfig.privacyAgreementAcceptance.versionToAccept) {
        const error = new UserInputError(
          "The accepted version of your privacy-token is not version" + ` '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`
        );
        error.extensions.exposeDetails = true;
        throw error;
      }
    }
  }
}
