import { signJwt, verifyJwt } from "./signHelper";
import { ILogger } from "../../logger/lib";

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
      throw new Error(`The accepted version is not version '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`);
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
        throw new Error("PrivacyAgreementAcceptanceToken missing!");
      }
      try {
        tokenPayload = verifyJwt(this.authConfig.secrets.privacyAgreementAcceptanceToken, privacyAgreementAcceptanceToken);
      } catch (e) {
        this.logger.warn("validatePrivacyAgreementAcceptanceToken.error.invalidPrivacyAgreementAcceptanceToken");
        throw new Error("PrivacyAgreementAcceptanceToken invalid!");
      }
      if (tokenPayload.acceptedVersion !== this.authConfig.privacyAgreementAcceptance.versionToAccept) {
        throw new Error(
          "The accepted version of privacyAgreementAcceptanceToken " +
            `is not version '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`
        );
      }
    }
  }

  public validateRegisterArguments(args) {
    if (this.isPrivacyAgreementCheckActive() === true) {
      const { privacyAgreementAcceptedAtInUTC, privacyAgreementAcceptedVersion } = this.parserMeta;
      let tokenPayload;
      if (args.input[privacyAgreementAcceptedAtInUTC] == null || args.input[privacyAgreementAcceptedVersion] == null) {
        throw new Error(
          `The privacy-fields ('${privacyAgreementAcceptedAtInUTC}', '${privacyAgreementAcceptedVersion}') are required for creating a user.`
        );
      }
      if (args.privacyAgreementAcceptanceToken == null) {
        throw new Error("Missing privacyAgreementAcceptanceToken argument.");
      }
      try {
        tokenPayload = verifyJwt(this.authConfig.secrets.privacyAgreementAcceptanceToken, args.privacyAgreementAcceptanceToken);
      } catch (e) {
        throw new Error("Invalid privacy token.");
      }
      if (
        tokenPayload.acceptedAtInUTC !== args.input[privacyAgreementAcceptedAtInUTC] ||
        tokenPayload.acceptedVersion !== args.input[privacyAgreementAcceptedVersion]
      ) {
        throw new Error(
          `The privacy-fields ('${privacyAgreementAcceptedAtInUTC}', '${privacyAgreementAcceptedVersion}') must match the payload of the privacy-token.`
        );
      }
      if (tokenPayload.acceptedVersion !== this.authConfig.privacyAgreementAcceptance.versionToAccept) {
        throw new Error(
          "The accepted version of your privacy-token is not version" + ` '${this.authConfig.privacyAgreementAcceptance.versionToAccept}'.`
        );
      }
    }
  }
}
