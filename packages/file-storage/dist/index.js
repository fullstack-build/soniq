"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
const db_1 = require("@fullstack-one/db");
const server_1 = require("@fullstack-one/server");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const config_1 = require("@fullstack-one/config");
const graphql_1 = require("@fullstack-one/graphql");
const auth_1 = require("@fullstack-one/auth");
const schema_builder_1 = require("@fullstack-one/schema-builder");
const logger_1 = require("@fullstack-one/logger");
const Minio = require("minio");
exports.Minio = Minio;
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
const parser_1 = require("./parser");
const Verifier_1 = require("./Verifier");
exports.Verifier = Verifier_1.Verifier;
const DefaultVerifier_1 = require("./DefaultVerifier");
exports.DefaultVerifier = DefaultVerifier_1.DefaultVerifier;
const FileName_1 = require("./FileName");
exports.FileName = FileName_1.FileName;
const fs = require("fs");
// extend migrations
require("./migrationExtension");
const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");
let FileStorage = class FileStorage {
    constructor(loggerFactory, dbGeneralPool, server, bootLoader, config, graphQl, schemaBuilder, auth) {
        this.verifiers = {};
        this.verifierObjects = {};
        this.loggerFactory = loggerFactory;
        this.server = server;
        this.dbGeneralPool = dbGeneralPool;
        this.graphQl = graphQl;
        this.schemaBuilder = schemaBuilder;
        this.config = config;
        this.auth = auth;
        // register package config
        this.fileStorageConfig = config.registerConfig("FileStorage", `${__dirname}/../config`);
        this.logger = this.loggerFactory.create(this.constructor.name);
        // add migration path
        this.schemaBuilder.getDbSchemaBuilder().addMigrationPath(`${__dirname}/..`);
        this.schemaBuilder.extendSchema(schema);
        this.schemaBuilder.addExtension(parser_1.getParser());
        this.graphQl.addResolvers(this.getResolvers());
        this.graphQl.addHook("postMutation", this.postMutationHook.bind(this));
        this.addVerifier("DEFAULT", DefaultVerifier_1.DefaultVerifier);
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = new Minio.Client(this.fileStorageConfig.minio);
            try {
                // Create a presignedGetUrl for a not existing object to force minio to initialize itself. (It loads internally the bucket region)
                // This prevents errors when large queries require a lot of signed URL's for the first time after boot.
                yield this.client.presignedGetObject(this.fileStorageConfig.bucket, "notExistingObject.nothing", 1);
                Object.keys(this.verifiers).forEach((key) => {
                    // tslint:disable-next-line:variable-name
                    const CurrentVerifier = this.verifiers[key];
                    this.verifierObjects[key] = new CurrentVerifier(this.client, this.fileStorageConfig.bucket);
                });
            }
            catch (err) {
                // TODO: Dustin: I added this try catch. It was stopping my boot scripts from completing. pls check this.
                // log error and ignore
                this.logger.warn(err);
            }
        });
    }
    postMutationHook(info, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const entityId = info.entityId;
                const result = yield this.auth.adminQuery("SELECT * FROM _meta.file_todelete_by_entity($1);", [entityId]);
                result.rows.forEach((row) => {
                    const fileName = new FileName_1.FileName(row);
                    this.deleteFileAsAdmin(fileName.name);
                });
            }
            catch (e) {
                // I don't care
            }
        });
    }
    presignedPutObject(objectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.presignedPutObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
        });
    }
    presignedGetObject(objectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.presignedGetObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
        });
    }
    deleteFileAsAdmin(fName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.auth.adminTransaction((client) => __awaiter(this, void 0, void 0, function* () {
                    const result = yield client.query("SELECT * FROM _meta.file_deleteone_admin($1);", [fName.id]);
                    if (result.rows.length < 1) {
                        throw new Error("Failed to delete file 'fileId' from db.");
                    }
                    yield this.deleteObjects(fName.prefix);
                }));
            }
            catch (e) {
                this.logger.warn("deleteFileAsAdmin.error", `Failed to delete file '${fName.name}'.`, e);
                // I don't care => File will be deleted by a cleanup-script some time
                return;
            }
        });
    }
    deleteFile(fName, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.auth.userTransaction(context.accessToken, (client) => __awaiter(this, void 0, void 0, function* () {
                    yield client.query("SELECT * FROM _meta.file_deleteone($1);", [fName.id]);
                    yield this.deleteObjects(fName.prefix);
                }));
            }
            catch (e) {
                this.logger.warn("deleteFile.error", `Failed to delete file '${fName.name}'.`, e);
                // I don't care => File will be deleted by a cleanup-script some time
                return;
            }
        });
    }
    deleteObjects(filePrefix) {
        return new Promise((resolve, reject) => {
            const objectsList = [];
            // List all object paths in bucket my-bucketname.
            // Cast this to any because minio returntype of listObjects is broken
            const objectsStream = this.client.listObjects(this.fileStorageConfig.bucket, filePrefix, true);
            objectsStream.on("data", (obj) => {
                objectsList.push(obj.name);
            });
            objectsStream.on("error", (err) => {
                reject(err);
            });
            objectsStream.on("end", () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.client.removeObjects(this.fileStorageConfig.bucket, objectsList);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    getResolvers() {
        return {
            "@fullstack-one/file-storage/createFile": (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const extension = args.extension.toLowerCase();
                const type = args.type || "DEFAULT";
                if (this.verifiers[type] == null) {
                    throw new Error(`A verifier for type '${type}' hasn't been defined.`);
                }
                const result = yield this.auth.userQuery(context.accessToken, 'SELECT _meta.file_create($1, $2) AS "fileId";', [extension, type]);
                const fName = new FileName_1.FileName({
                    id: result.rows[0].fileId,
                    type,
                    extension
                });
                const presignedPutUrl = yield this.presignedPutObject(fName.uploadName);
                return {
                    extension,
                    type,
                    fileName: fName.name,
                    uploadFileName: fName.uploadName,
                    presignedPutUrl
                };
            }),
            "@fullstack-one/file-storage/verifyFile": (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const fName = new FileName_1.FileName(args.fileName);
                const result = yield this.auth.userQuery(context.accessToken, 'SELECT _meta.file_get_type_to_verify($1) AS "type";', [fName.id]);
                const type = result.rows[0].type;
                let stat = null;
                if (this.verifierObjects[type] == null) {
                    throw new Error(`A verifier for type '${type}' hasn't been defined.`);
                }
                if (type !== fName.type) {
                    throw new Error(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`);
                }
                try {
                    stat = yield this.client.statObject(this.fileStorageConfig.bucket, fName.uploadName);
                }
                catch (e) {
                    if (e.message.toLowerCase().indexOf("not found") >= 0) {
                        throw new Error("Please upload a file before verifying.");
                    }
                    throw e;
                }
                const verifyFileName = fName.createTempName();
                const verifyCopyConditions = new Minio.CopyConditions();
                verifyCopyConditions.setMatchETag(stat.etag);
                yield this.client.copyObject(this.fileStorageConfig.bucket, verifyFileName, `/${this.fileStorageConfig.bucket}/${fName.uploadName}`, verifyCopyConditions);
                yield this.verifierObjects[type].verify(verifyFileName, fName);
                yield this.auth.userQuery(context.accessToken, "SELECT _meta.file_verify($1);", [fName.id]);
                // Try to clean up temp objects. However, don't care if it fails.
                try {
                    yield this.client.removeObjects(this.fileStorageConfig.bucket, [fName.uploadName, verifyFileName]);
                }
                catch (err) {
                    this.logger.warn("verifyFile.removeObjectsFail", err);
                }
                const objectNames = this.verifierObjects[fName.type].getObjectNames(fName);
                const objects = objectNames.map((object) => {
                    return {
                        objectName: object.objectName,
                        info: object.info,
                        presignedGetUrlPromise: this.presignedGetObject(object.objectName)
                    };
                });
                const bucketObjects = [];
                for (const object of objects) {
                    try {
                        bucketObjects.push({
                            objectName: object.objectName,
                            info: object.info,
                            presignedGetUrl: yield object.presignedGetUrlPromise
                        });
                    }
                    catch (err) {
                        this.logger.warn("readFiles.signFail.promise", err);
                    }
                }
                return {
                    fileName: fName.name,
                    objects: bucketObjects
                };
            }),
            "@fullstack-one/file-storage/clearUpFiles": (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                let result;
                if (args.fileName != null) {
                    const fName = new FileName_1.FileName(args.fieldName);
                    result = yield this.auth.userQuery(context.accessToken, "SELECT * FROM _meta.file_clearupone($1);", [fName.id]);
                }
                else {
                    result = yield this.auth.userQuery(context.accessToken, "SELECT * FROM _meta.file_clearup();");
                }
                const filesDeleted = result.rows.map((row) => new FileName_1.FileName(row));
                filesDeleted.forEach((fName) => {
                    this.deleteFile(fName, context);
                });
                return filesDeleted.map((fName) => fName.name);
            }),
            "@fullstack-one/file-storage/readFiles": (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const awaitingFileSignatures = [];
                if (obj[info.fieldName] == null) {
                    return [];
                }
                const data = obj[info.fieldName];
                for (const fileName of data) {
                    try {
                        const fName = new FileName_1.FileName(fileName);
                        const objectNames = this.verifierObjects[fName.type].getObjectNames(fName);
                        const objects = objectNames.map((object) => {
                            return {
                                objectName: object.objectName,
                                presignedGetUrlPromise: this.presignedGetObject(object.objectName),
                                info: object.info
                            };
                        });
                        awaitingFileSignatures.push({
                            fileName,
                            objects
                        });
                    }
                    catch (err) {
                        // Errors can be ignored => Failed Signs are not returned
                        this.logger.warn("readFiles.signFail", err);
                    }
                }
                const results = [];
                for (const fileObject of awaitingFileSignatures) {
                    try {
                        const objects = [];
                        // const presignedGetUrl = await fileObject.presignedGetUrlPromise;
                        const fileName = fileObject.fileName;
                        for (const object of fileObject.objects) {
                            try {
                                objects.push({
                                    objectName: object.objectName,
                                    info: object.info,
                                    presignedGetUrl: yield object.presignedGetUrlPromise
                                });
                            }
                            catch (err) {
                                this.logger.warn("readFiles.signFail.promise", err);
                            }
                        }
                        results.push({
                            fileName,
                            objects
                        });
                    }
                    catch (err) {
                        // Errors can be ignored => Failed Signs are not returned
                        this.logger.warn("readFiles.signFail.promise", err);
                    }
                }
                return results;
            })
        };
    }
    addVerifier(type, fn) {
        const regex = "^[_a-zA-Z][_a-zA-Z0-9]{3,30}$";
        const regexp = new RegExp(regex);
        if (regexp.test(type) !== true) {
            throw new Error(`The type '${type}' has to match RegExp '${regex}'.`);
        }
        if (this.verifiers[type] == null) {
            this.verifiers[type] = fn;
        }
        else {
            throw new Error(`A verifier for type '${type}' already exists.`);
        }
    }
};
FileStorage = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(1, di_1.Inject((type) => db_1.DbGeneralPool)),
    __param(2, di_1.Inject((type) => server_1.Server)),
    __param(3, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(4, di_1.Inject((type) => config_1.Config)),
    __param(5, di_1.Inject((type) => graphql_1.GraphQl)),
    __param(6, di_1.Inject((type) => schema_builder_1.SchemaBuilder)),
    __param(7, di_1.Inject((type) => auth_1.Auth)),
    __metadata("design:paramtypes", [logger_1.LoggerFactory, Object, Object, Object, Object, Object, Object, Object])
], FileStorage);
exports.FileStorage = FileStorage;
