import { sha256, sha512 } from "./crypto";
import * as jwt from "jsonwebtoken";

export function getAdminSignature(adminSecret) {
  const ts = Date.now().toString();

  const payload = `${ts}:${adminSecret}`;

  return `${ts}:${sha256(payload)}`;
}

export function getProviderSignature(adminSecret, provider, userIdentifier) {
  const payload = `${provider}:${userIdentifier}:${adminSecret}`;

  return sha512(payload);
}

export function signJwt(jwtSecret, payload, expiresIn) {
  return Buffer.from(jwt.sign(payload, jwtSecret, { expiresIn }), "utf8").toString("hex");
}

export function verifyJwt(jwtSecret, token) {
  return jwt.verify(Buffer.from(token, "hex").toString("utf8"), jwtSecret);
}
