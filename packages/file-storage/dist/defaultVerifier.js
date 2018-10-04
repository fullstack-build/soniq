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
const Minio = require("minio");
const Verifier_1 = require("./Verifier");
class DefaultVerifier extends Verifier_1.Verifier {
    verify(verifyFileName, fName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stat = yield this.client.statObject(this.bucket, verifyFileName);
                const copyConditions = new Minio.CopyConditions();
                copyConditions.setMatchETag(stat.etag);
                yield this.client.copyObject(this.bucket, fName.name, `/${this.bucket}/${verifyFileName}`, copyConditions);
            }
            catch (e) {
                if (e.message.toLowerCase().indexOf("not found") >= 0) {
                    throw new Error("Please upload a file before verifying.");
                }
                throw e;
            }
        });
    }
    getObjectNames(fName) {
        return [
            {
                objectName: fName.name,
                info: "default"
            }
        ];
    }
}
exports.DefaultVerifier = DefaultVerifier;
