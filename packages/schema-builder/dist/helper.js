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
const graphql_1 = require("graphql");
const fs_1 = require("fs");
const util_1 = require("util");
const writeFileAsync = util_1.promisify(fs_1.writeFile);
var graphQl;
(function (graphQl) {
    var helper;
    (function (helper) {
        helper.parseGraphQlSchema = (graphQlSchema) => {
            try {
                return graphql_1.parse(graphQlSchema, { noLocation: true });
            }
            catch (err) {
                throw err;
            }
        };
        helper.printGraphQlDocument = (gQlDocument) => {
            try {
                return graphql_1.print(gQlDocument);
            }
            catch (err) {
                throw err;
            }
        };
        helper.writeTableObjectIntoMigrationsFolder = (migrationsPath, tableObject, migrationId) => __awaiter(this, void 0, void 0, function* () {
            // getSqlFromMigrationObj name for migration
            const timestampMigration = migrationsPath + (migrationId || new Date().getTime()) + '.json';
            try {
                return yield writeFileAsync(timestampMigration, JSON.stringify(tableObject, null, 2), 'utf8');
            }
            catch (err) {
                throw err;
            }
        });
    })(helper = graphQl.helper || (graphQl.helper = {}));
})(graphQl = exports.graphQl || (exports.graphQl = {}));
