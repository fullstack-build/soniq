
import { sha256, sha512 } from './crypto';
// tslint:disable-next-line:no-var-requires
const jwt = require('jsonwebtoken');

const requiredSecrets = {
  jwt: 'AUTH_JWT_SECRET',
  admin: 'AUTH_ADMIN_SECRET',
  providers: 'AUTH_PROVIDERS_SECRET',
  cookie: 'AUTH_COOKIE_SECRET'
};

const secrets: any = {};
/*
// Is checked through .env.example
Object.keys(requiredSecrets).forEach((key) => {
  if (process.env[requiredSecrets[key]] != null) {
    secrets[key] = process.env[requiredSecrets[key]];
  } else {
    throw new Error(`Environment variable ${requiredSecrets[key]} is required.`);
  }
});*/

export function getAdminSignature() {
  const ts = Date.now().toString();

  const payload = `${ts}:${secrets.admin}`;

  return `${ts}:${sha256(payload)}`;
}

export function getProviderSignature(provider, userIdentifier) {
  const payload = `${provider}:${userIdentifier}:${secrets.admin}`;

  return sha512(payload);
}

export function getCookieSecret() {
  return secrets.cookie;
}

export function signJwt(payload, expiresIn) {
  return jwt.sign(payload, secrets.jwt, { expiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, secrets.jwt);
}
