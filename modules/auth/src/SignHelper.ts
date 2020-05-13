import { sha256, sha512 } from "./crypto";
import * as jwt from "jsonwebtoken";
import { CryptoFactory } from "./CryptoFactory";

export class SignHelper {
  private _adminSecret: string;
  private _rootSecret: string;
  private _cryptoFactory: CryptoFactory;

  public constructor(adminSecret: string, rootSecret: string, cryptoFactory: CryptoFactory) {
    this._adminSecret = adminSecret;
    this._rootSecret = rootSecret;
    this._cryptoFactory = cryptoFactory;
  }

  public getAdminSignature(): string {
    const ts: string = Date.now().toString();

    const payload: string = `${ts}:${this._adminSecret}`;

    return `${ts}:${sha256(payload)}`;
  }

  public getRootSignature(): string {
    const ts: string = Date.now().toString();

    const payload: string = `${ts}:${this._rootSecret}`;

    return `${ts}:${sha256(payload)}`;
  }

  public getProviderSignature(secret: string, provider: string, userIdentifier: string): string {
    const payload: string = `${provider}:${userIdentifier}:${secret}`;

    return sha512(payload);
  }

  public signJwt(jwtSecret: string, payload: string, expiresIn: string | number | undefined): string {
    return this._cryptoFactory.encrypt(jwt.sign(payload, jwtSecret, { expiresIn }));
  }

  public verifyJwt(jwtSecret: string, token: string): string | object {
    return jwt.verify(this._cryptoFactory.decrypt(token), jwtSecret);
  }
}
