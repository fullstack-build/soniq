import { ISodiumConfig, ISodiumConfigOptional, IPasswordData } from "./interfaces";

// tslint:disable-next-line:import-name
// import sodium from 'sodium-native';
// tslint:disable-next-line:no-var-requires
const sodium = require("sodium-native");

// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");

export function sha256(input) {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex");
}
export function sha512(input) {
  return crypto
    .createHash("sha512")
    .update(input)
    .digest("hex");
}

export function createConfig(config: ISodiumConfigOptional): ISodiumConfig {
  const sodiumConfig: ISodiumConfig = {
    saltBytes: sodium.crypto_pwhash_SALTBYTES,
    hashBytes: sodium.crypto_pwhash_STRBYTES,
    opslimit: sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    memlimit: sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    algorithm: sodium.crypto_pwhash_ALG_DEFAULT
  };

  Object.keys(sodiumConfig).forEach((key) => {
    if (config[key] != null && typeof config[key] === typeof sodiumConfig[key]) {
      sodiumConfig[key] = config[key];
    }
  });

  return sodiumConfig;
}

export function newHash(password: string, sodiumConfig: ISodiumConfig): Promise<IPasswordData> {
  return new Promise((resolve, reject) => {
    const passwordBuffer = Buffer.from(password);

    const hashBuffer = Buffer.allocUnsafe(sodiumConfig.hashBytes);

    const saltBuffer = Buffer.allocUnsafe(sodiumConfig.saltBytes);

    sodium.randombytes_buf(saltBuffer);

    const meta = {
      salt: saltBuffer.toString("hex"),
      hashBytes: sodiumConfig.hashBytes,
      opslimit: sodiumConfig.opslimit,
      memlimit: sodiumConfig.memlimit,
      algorithm: sodiumConfig.algorithm
    };

    sodium.crypto_pwhash_async(
      hashBuffer,
      passwordBuffer,
      saltBuffer,
      sodiumConfig.opslimit,
      sodiumConfig.memlimit,
      sodiumConfig.algorithm,
      (err) => {
        if (err != null) {
          return reject(err);
        }

        const hash = hashBuffer.toString("hex");

        resolve({
          hash,
          meta
        });
      }
    );
  });
}

export function hashByMeta(password, meta): Promise<IPasswordData> {
  return new Promise((resolve, reject) => {
    const passwordBuffer = Buffer.from(password);

    const hashBuffer = Buffer.allocUnsafe(meta.hashBytes);

    const saltBuffer = Buffer.from(meta.salt, "hex");

    sodium.crypto_pwhash_async(hashBuffer, passwordBuffer, saltBuffer, meta.opslimit, meta.memlimit, meta.algorithm, (err) => {
      if (err != null) {
        return reject(err);
      }

      const hash = hashBuffer.toString("hex");

      resolve({
        hash,
        meta
      });
    });
  });
}

export function generateRandomPassword(bytes: number = 64): string {
  const randomBuffer = Buffer.allocUnsafe(bytes);

  sodium.randombytes_buf(randomBuffer);

  return randomBuffer.toString("hex");
}
