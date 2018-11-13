"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
class FbHelper {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.axios = axios_1.default.create({
            baseURL: config.baseURL
        });
    }
    debugToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Proof token: https://developers.facebook.com/docs/graph-api/securing-requests
                const proof = crypto
                    .createHmac("sha256", this.config.clientSecret)
                    .update(token)
                    .digest("hex");
                const response = yield this.axios.get(this.config.debugTokenPath, {
                    params: {
                        input_token: token,
                        access_token: `${this.config.clientID}|${this.config.clientSecret}`,
                        appsecret_proof: proof
                    }
                });
                if (response != null && response.data != null && response.data.data != null) {
                    const { data } = response.data;
                    if (data.is_valid === true && data.app_id.toString() === this.config.clientID.toString()) {
                        return true;
                    }
                    else {
                        if (data.is_valid !== true) {
                            throw new Error("Token is not valid.");
                        }
                        if (data.app_id.toString() !== this.config.clientID.toString()) {
                            throw new Error("AppId does not match.");
                        }
                    }
                }
                else {
                    throw new Error("Body is null.");
                }
            }
            catch (e) {
                this.logger.warn("Facebook access-token is not valid.", e);
                throw new Error("Facebook access-token is not valid.");
            }
        });
    }
    getProfile(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check token as described here: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
            yield this.debugToken(token);
            // Proof token: https://developers.facebook.com/docs/graph-api/securing-requests
            const proof = crypto
                .createHmac("sha256", this.config.clientSecret)
                .update(token)
                .digest("hex");
            const response = yield this.axios.get(this.config.userPath, {
                params: {
                    fields: this.config.fields.join(","),
                    access_token: token,
                    appsecret_proof: proof
                }
            });
            if (response.data.email == null) {
                throw new Error("An email adress is required for authentication. However, none has been provided by facebook.");
            }
            if (response.data.id == null) {
                throw new Error("An id is required for authentication. However, none has been provided by facebook.");
            }
            return response.data;
        });
    }
}
exports.FbHelper = FbHelper;
