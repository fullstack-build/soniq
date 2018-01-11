import { sodium } from 'sodium-native';

// tslint:disable-next-line:no-var-requires
const crypto = require('crypto');

export function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
export function sha512(input) {
  return crypto.createHash('sha512').update(input).digest('hex');
}

export function createConfig(config) {
  const c = {
    saltBytes: sodium.crypto_pwhash_SALTBYTES,
    hashBytes: sodium.crypto_pwhash_STRBYTES,
    opslimit: sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    memlimit: sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    algorithm: sodium.crypto_pwhash_ALG_DEFAULT
  };

  Object.keys(c).forEach((key) => {
    if (config[key] != null && typeof config[key] === typeof c[key]) {
      c[key] = config[key];
    }
  });

  return c;
}

export function newHash(password, config) {
  return new Promise((resolve, reject) => {

    const passwordBuffer = Buffer.from(password);

    const hashBuffer = Buffer.allocUnsafe(config.hashBytes);

    const saltBuffer = Buffer.allocUnsafe(config.saltBytes);

    sodium.randombytes_buf(saltBuffer);

    const meta = {
      salt: saltBuffer.toString('hex'),
      hashBytes: config.hashBytes,
      opslimit: config.opslimit,
      memlimit: config.memlimit,
      algorithm: config.algorithm
    };

    sodium.crypto_pwhash_async(hashBuffer, passwordBuffer, saltBuffer, config.opslimit, config.memlimit, config.algorithm, (err) => {
      if (err != null) {
        return reject(err);
      }

      const hash = hashBuffer.toString('hex');

      resolve({
        hash,
        meta
      });
    });
  });
}

export function hashByMeta(password, meta) {
  return new Promise((resolve, reject) => {
    const passwordBuffer = Buffer.from(password);

    const hashBuffer = Buffer.allocUnsafe(meta.hashBytes);

    const saltBuffer = Buffer.from(meta.salt, 'hex');

    sodium.crypto_pwhash_async(hashBuffer, passwordBuffer, saltBuffer, meta.opslimit, meta.memlimit, meta.algorithm, (err) => {
      if (err != null) {
        return reject(err);
      }

      const hash = hashBuffer.toString('hex');

      resolve({
        hash,
        meta
      });
    });
  });
}
