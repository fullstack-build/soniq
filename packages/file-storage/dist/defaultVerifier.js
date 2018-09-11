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
function defaultVerifier(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield ctx.client.statObject(ctx.bucket, ctx.verifyFileName);
            return stat.etag;
        }
        catch (e) {
            if (e.message.toLowerCase().indexOf('not found') >= 0) {
                throw new Error('Please upload a file before verifying.');
            }
            throw e;
        }
    });
}
exports.defaultVerifier = defaultVerifier;
