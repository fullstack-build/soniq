import { Encoder } from "./Encoder";
import * as crypto from "crypto";
const IV_LENGTH: number = 16; // For AES, this is always 16

export class CryptoFactory {
  private _secret: string;
  private _algorithm: string;
  private _encoder: Encoder;

  public constructor(secret: string, algorithm: string, encoder: Encoder = new Encoder()) {
    this._secret = secret;
    this._algorithm = algorithm;
    this._encoder = encoder;
  }

  public encrypt(text: string): string {
    const iv: Buffer = crypto.randomBytes(IV_LENGTH);
    const cipher: crypto.Cipher = crypto.createCipheriv(this._algorithm, this._secret, iv);
    let encrypted: Buffer = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const hexString: string = iv.toString("hex") + encrypted.toString("hex");

    return this._encoder.hexToString(hexString);
  }

  public decrypt(encodedText: string): string {
    if (encodedText == null || encodedText.length < 1) {
      throw new Error("Encoded token cannot be null");
    }
    const text: string = this._encoder.stringToHex(encodedText);

    const iv: Buffer = Buffer.from(text.substr(0, IV_LENGTH * 2), "hex");
    const encryptedText: Buffer = Buffer.from(text.substr(IV_LENGTH * 2), "hex");
    const decipher: crypto.Decipher = crypto.createDecipheriv(this._algorithm, this._secret, iv);
    let decrypted: Buffer = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}
