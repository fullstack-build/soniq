
import { sha256, sha512 } from './crypto';
import * as jwt from 'jsonwebtoken';

export function getAdminSignature(adminSecret) {
  const ts = Date.now().toString();

  const payload = `${ts}:${adminSecret}`;

  return `${ts}:${sha256(payload)}`;
}

export function getProviderSignature(adminSecret, provider, userIdentifier) {
  const payload = `${provider}:${userIdentifier}:${adminSecret}`;

  return sha512(payload);
}

export function signJwt(jwtSecret, payload, expiresIn, crypter = null) {
  if (crypter != null) {
    return crypter.encrypt(jwt.sign(payload, jwtSecret, { expiresIn }));
  }
  return jwt.sign(payload, jwtSecret, { expiresIn });
}

export function verifyJwt(jwtSecret, token, crypter = null) {
  if (crypter != null) {
    return jwt.verify(crypter.decrypt(token), jwtSecret);
  }
  return jwt.verify(token, jwtSecret);
}
