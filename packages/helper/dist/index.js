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
const fastGlob = require("fast-glob");
const fs_1 = require("fs");
const util_1 = require("util");
const readFileAsync = util_1.promisify(fs_1.readFile);
const writeFileAsync = util_1.promisify(fs_1.writeFile);
var helper;
(function (helper) {
    helper.loadFilesByGlobPattern = (pattern) => __awaiter(this, void 0, void 0, function* () {
        try {
            const files = fastGlob.sync(pattern, {
                deep: false,
                onlyFiles: true,
            });
            const readFilesPromises = [];
            files.map((filePath) => {
                readFilesPromises.push(readFileAsync(filePath, 'utf8'));
            });
            return yield Promise.all(readFilesPromises);
        }
        catch (err) {
            throw err;
        }
    });
    helper.requireFilesByGlobPattern = (pattern) => __awaiter(this, void 0, void 0, function* () {
        try {
            const files = yield fastGlob.sync(pattern, { deep: false, onlyFiles: true });
            const requiredFiles = [];
            files.map((filePath) => {
                let requiredFileContent = null;
                try {
                    const requiredFile = require(filePath);
                    requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;
                }
                catch (err) {
                    throw err;
                }
                requiredFiles.push(requiredFileContent);
            });
            return requiredFiles;
        }
        catch (err) {
            throw err;
        }
    });
    helper.requireFilesByGlobPatternAsObject = (pattern) => __awaiter(this, void 0, void 0, function* () {
        try {
            const files = yield fastGlob.sync(pattern, { deep: false, onlyFiles: true });
            const requiredFiles = {};
            files.map((filePath) => {
                let requiredFileContent = null;
                try {
                    const requiredFile = require(filePath);
                    const name = filePath.split('/').pop().split('.ts')[0];
                    requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;
                    requiredFiles[name] = requiredFileContent;
                }
                catch (err) {
                    throw err;
                }
            });
            return requiredFiles;
        }
        catch (err) {
            throw err;
        }
    });
})(helper = exports.helper || (exports.helper = {}));
