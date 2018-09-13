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
class Verifier {
    constructor(client, bucket) {
        this.client = client;
        this.bucket = bucket;
    }
    verify(verifyFileName, id, type, extension) {
        return __awaiter(this, void 0, void 0, function* () {
            // tslint:disable-next-line:quotemark
            throw new Error(`Please implement the 'verify(verifyFileName, id, type, extension)' method when extending class Verifier.`);
        });
    }
    // Returns a
    getObjectNames(id, type, extension) {
        // tslint:disable-next-line:quotemark
        throw new Error(`Please implement the 'getObjectNames(id, type, extension)' method when extending class Verifier.`);
    }
}
exports.Verifier = Verifier;
