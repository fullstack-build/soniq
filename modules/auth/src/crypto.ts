import { ISodiumConfig, ISodiumConfigOptional, IPasswordData, IPasswordMeta } from "./interfaces";

import * as sodium from "sodium-native";

import * as crypto from "crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
export function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}

export function createConfig(config: ISodiumConfigOptional): ISodiumConfig {
  const sodiumConfig: ISodiumConfig = {
    saltBytes: sodium.crypto_pwhash_SALTBYTES,
    hashBytes: sodium.crypto_pwhash_STRBYTES,
    opslimit: sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    memlimit: sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    algorithm: sodium.crypto_pwhash_ALG_DEFAULT,
  };

  Object.keys(sodiumConfig).forEach((key: string) => {
    if (config[key] != null && typeof config[key] === typeof sodiumConfig[key]) {
      sodiumConfig[key] = config[key];
    }
  });

  return sodiumConfig;
}

export function newHash(password: string, sodiumConfig: ISodiumConfig): Promise<IPasswordData> {
  return new Promise<IPasswordData>((resolve: (passwordData: IPasswordData) => void, reject: (err: Error) => void) => {
    const passwordBuffer: Buffer = Buffer.from(password);

    const hashBuffer: Buffer = Buffer.allocUnsafe(sodiumConfig.hashBytes);

    const saltBuffer: Buffer = Buffer.allocUnsafe(sodiumConfig.saltBytes);

    sodium.randombytes_buf(saltBuffer);

    const meta: IPasswordMeta = {
      salt: saltBuffer.toString("hex"),
      hashBytes: sodiumConfig.hashBytes,
      opslimit: sodiumConfig.opslimit,
      memlimit: sodiumConfig.memlimit,
      algorithm: sodiumConfig.algorithm,
    };

    sodium.crypto_pwhash_async(
      hashBuffer,
      passwordBuffer,
      saltBuffer,
      sodiumConfig.opslimit,
      sodiumConfig.memlimit,
      sodiumConfig.algorithm,
      (err: Error | null) => {
        if (err != null) {
          return reject(err);
        }

        const hash: string = hashBuffer.toString("hex");

        resolve({
          hash,
          meta,
        });
      }
    );
  });
}

export function hashByMeta(password: string, meta: IPasswordMeta): Promise<IPasswordData> {
  return new Promise((resolve: (passwordData: IPasswordData) => void, reject: (err: Error) => void) => {
    const passwordBuffer: Buffer = Buffer.from(password);

    const hashBuffer: Buffer = Buffer.allocUnsafe(meta.hashBytes);

    const saltBuffer: Buffer = Buffer.from(meta.salt, "hex");

    sodium.crypto_pwhash_async(
      hashBuffer,
      passwordBuffer,
      saltBuffer,
      meta.opslimit,
      meta.memlimit,
      meta.algorithm,
      (err: Error | null) => {
        if (err != null) {
          return reject(err);
        }

        const hash: string = hashBuffer.toString("hex");

        resolve({
          hash,
          meta,
        });
      }
    );
  });
}

export function generateRandomPassword(bytes: number = 64): string {
  const randomBuffer: Buffer = Buffer.allocUnsafe(bytes);

  sodium.randombytes_buf(randomBuffer);

  return randomBuffer.toString("hex");
}
