import { sha256, sha512 } from "./crypto";
import * as jwt from "jsonwebtoken";
import { CryptoFactory } from "./CryptoFactory";

export class SignHelper {
  private adminSecret: string;
  private cryptoFactory: CryptoFactory;

  constructor(adminSecret: string, cryptoFactory: CryptoFactory) {
    this.adminSecret = adminSecret;
    this.cryptoFactory = cryptoFactory;
  }

  public getAdminSignature() {
    const ts = Date.now().toString();

    const payload = `${ts}:${this.adminSecret}`;

    return `${ts}:${sha256(payload)}`;
  }

  public getProviderSignature(secret, provider, userIdentifier) {
    const payload = `${provider}:${userIdentifier}:${secret}`;

    return sha512(payload);
  }

  public signJwt(jwtSecret, payload, expiresIn) {
    return this.cryptoFactory.encrypt(jwt.sign(payload, jwtSecret, { expiresIn }));
  }

  public verifyJwt(jwtSecret, token) {
    return jwt.verify(this.cryptoFactory.decrypt(token), jwtSecret);
  }
}
