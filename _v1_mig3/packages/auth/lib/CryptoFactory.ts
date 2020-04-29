import { Encoder } from "./Encoder";

// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");
const IV_LENGTH = 16; // For AES, this is always 16

export class CryptoFactory {
  private secret: string;
  private algorithm: string;
  private encoder: Encoder;

  constructor(secret: string, algorithm: string, encoder: Encoder = new Encoder()) {
    this.secret = secret;
    this.algorithm = algorithm;
    this.encoder = encoder;
  }

  public encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.secret, iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const hexString = iv.toString("hex") + encrypted.toString("hex");

    return this.encoder.hexToString(hexString);
  }

  public decrypt(encodedText: string) {
    const text = this.encoder.stringToHex(encodedText);

    const iv = Buffer.from(text.substr(0, IV_LENGTH * 2), "hex");
    const encryptedText = Buffer.from(text.substr(IV_LENGTH * 2), "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.secret, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}
