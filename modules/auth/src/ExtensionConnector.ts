import { ExtensionConnector } from "soniq";
import { Auth } from ".";
import { AuthQueryHelper } from "./AuthQueryHelper";

export class AuthExtensionConnector extends ExtensionConnector {
  private _auth: Auth;

  public constructor(auth: Auth) {
    super();
    this._auth = auth;
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    return this._auth.getAuthQueryHelper();
  }

  public detach(): void {}
}
