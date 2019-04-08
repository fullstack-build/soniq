// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");
const IV_LENGTH = 16; // For AES, this is always 16

export class CryptoFactory {
  private secret: string;
  private algorithm: string;

  constructor(secret: string, algorithm: string) {
    this.secret = secret;
    this.algorithm = algorithm;
  }

  public encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.secret, iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString("hex") + encrypted.toString("hex");
  }

  public decrypt(text: string) {
    const iv = Buffer.from(text.substr(0, IV_LENGTH * 2), "hex");
    const encryptedText = Buffer.from(text.substr(IV_LENGTH * 2), "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.secret, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}
