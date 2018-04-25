"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("./crypto");
const jwt = require("jsonwebtoken");
function getAdminSignature(adminSecret) {
    const ts = Date.now().toString();
    const payload = `${ts}:${adminSecret}`;
    return `${ts}:${crypto_1.sha256(payload)}`;
}
exports.getAdminSignature = getAdminSignature;
function getProviderSignature(adminSecret, provider, userIdentifier) {
    const payload = `${provider}:${userIdentifier}:${adminSecret}`;
    return crypto_1.sha512(payload);
}
exports.getProviderSignature = getProviderSignature;
function signJwt(jwtSecret, payload, expiresIn) {
    return jwt.sign(payload, jwtSecret, { expiresIn });
}
exports.signJwt = signJwt;
function verifyJwt(jwtSecret, token) {
    return jwt.verify(token, jwtSecret);
}
exports.verifyJwt = verifyJwt;
