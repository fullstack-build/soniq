"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("./crypto");
// tslint:disable-next-line:no-var-requires
const jwt = require('jsonwebtoken');
const requiredSecrets = {
    jwt: 'AUTH_JWT_SECRET',
    admin: 'AUTH_ADMIN_SECRET',
    providers: 'AUTH_PROVIDERS_SECRET',
    cookie: 'AUTH_COOKIE_SECRET'
};
const secrets = {};
/*
// Is checked through .env.example
Object.keys(requiredSecrets).forEach((key) => {
  if (process.env[requiredSecrets[key]] != null) {
    secrets[key] = process.env[requiredSecrets[key]];
  } else {
    throw new Error(`Environment variable ${requiredSecrets[key]} is required.`);
  }
});*/
function getAdminSignature() {
    const ts = Date.now().toString();
    const payload = `${ts}:${secrets.admin}`;
    return `${ts}:${crypto_1.sha256(payload)}`;
}
exports.getAdminSignature = getAdminSignature;
function getProviderSignature(provider, userIdentifier) {
    const payload = `${provider}:${userIdentifier}:${secrets.admin}`;
    return crypto_1.sha512(payload);
}
exports.getProviderSignature = getProviderSignature;
function getCookieSecret() {
    return secrets.cookie;
}
exports.getCookieSecret = getCookieSecret;
function signJwt(payload, expiresIn) {
    return jwt.sign(payload, secrets.jwt, { expiresIn });
}
exports.signJwt = signJwt;
function verifyJwt(token) {
    return jwt.verify(token, secrets.jwt);
}
exports.verifyJwt = verifyJwt;
