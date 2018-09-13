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
const KoaRouter = require("koa-router");
const koaBody = require("koa-bodyparser");
const Minio = require("minio");
exports.Minio = Minio;
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
const parser_1 = require("./parser");
const Verifier_1 = require("./Verifier");
exports.Verifier = Verifier_1.Verifier;
const DefaultVerifier_1 = require("./DefaultVerifier");
exports.DefaultVerifier = DefaultVerifier_1.DefaultVerifier;
const fs = require("fs");
// extend migrations
require("./migrationExtension");
const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');
let FileStorage = class FileStorage {
    constructor(loggerFactory, dbGeneralPool, server, bootLoader, config, graphQl, schemaBuilder, auth) {
        this.verifiers = {};
        this.verifierObjects = {};
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        this.logger = loggerFactory.create('AutoMigrate');
        this.server = server;
        this.dbGeneralPool = dbGeneralPool;
        this.graphQl = graphQl;
        this.schemaBuilder = schemaBuilder;
        this.config = config;
        this.auth = auth;
        // add migration path
        this.schemaBuilder.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');
        this.schemaBuilder.extendSchema(schema);
        this.schemaBuilder.addExtension(parser_1.getParser());
        this.graphQl.addResolvers(this.getResolvers());
        this.graphQl.addHook('postMutation', this.postMutationHook.bind(this));
        this.addVerifier('DEFAULT', DefaultVerifier_1.DefaultVerifier);
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    addVerifier(type, fn) {
        if (this.verifiers[type] == null) {
            this.verifiers[type] = fn;
        }
        else {
            throw new Error(`A verifier for type '${type}' already exists.`);
        }
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fileStorageConfig = this.config.getConfig('fileStorage');
            this.client = new Minio.Client(this.fileStorageConfig.minio);
            Object.keys(this.verifiers).forEach((key) => {
                // tslint:disable-next-line:variable-name
                const CurrentVerifier = this.verifiers[key];
                this.verifierObjects[key] = new CurrentVerifier(this.client, this.fileStorageConfig.bucket);
            });
            const authRouter = new KoaRouter();
            const app = this.server.getApp();
            authRouter.get('/test', (ctx) => __awaiter(this, void 0, void 0, function* () {
                ctx.body = 'Hallo';
            }));
            authRouter.use(koaBody());
            app.use(authRouter.routes());
            app.use(authRouter.allowedMethods());
        });
    }
    postMutationHook(info, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const entityId = info.entityId;
                const result = yield this.auth.adminQuery('SELECT * FROM _meta.file_todelete_by_entity($1);', [entityId]);
                result.rows.forEach((row) => {
                    this.deleteFileAsAdmin(`${row.id}_${row.type}.${row.extension}`);
                });
            }
            catch (e) {
                // I don't care
            }
        });
    }
    presignedPutObject(objectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.presignedPutObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
        });
    }
    presignedGetObject(objectName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.presignedGetObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
        });
    }
    deleteFileAsAdmin(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.auth.adminTransaction((client) => __awaiter(this, void 0, void 0, function* () {
                    const filePrefix = fileName.split('.')[0];
                    const fileId = filePrefix.split('_')[0];
                    const result = yield client.query('SELECT * FROM _meta.file_deleteone_admin($1);', [fileId]);
                    if (result.rows.length < 1) {
                        throw new Error("Failed to delete file 'fileId' from db.");
                    }
                    yield this.deleteObjects(filePrefix);
                }));
            }
            catch (e) {
                this.logger.warn('deleteFileAsAdmin.error', `Failed to delete file '${fileName}'.`, e);
                // I don't care => File will be deleted by a cleanup-script some time
                return;
            }
        });
    }
    deleteFile(fileName, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.auth.userTransaction(context.accessToken, (client) => __awaiter(this, void 0, void 0, function* () {
                    const filePrefix = fileName.split('.')[0];
                    const fileId = filePrefix.split('_')[0];
                    yield client.query('SELECT * FROM _meta.file_deleteone($1);', [fileId]);
                    yield this.deleteObjects(filePrefix);
                }));
            }
            catch (e) {
                this.logger.warn('deleteFile.error', `Failed to delete file '${fileName}'.`, e);
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
            objectsStream.on('data', (obj) => {
                objectsList.push(obj.name);
            });
            objectsStream.on('error', (err) => {
                reject(err);
            });
            objectsStream.on('end', () => __awaiter(this, void 0, void 0, function* () {
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
            '@fullstack-one/file-storage/createFile': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const extension = args.extension.toLowerCase();
                const type = args.type || 'DEFAULT';
                if (this.verifiers[type] == null) {
                    throw new Error(`A verifier for type '${type}' hasn't been defined.`);
                }
                const result = yield this.auth.userQuery(context.accessToken, 'SELECT _meta.file_create($1, $2) AS "fileId";', [extension, type]);
                const fileId = result.rows[0].fileId;
                const fileName = `${fileId}_${type}.${extension}`;
                const uploadFileName = `${fileId}_${type}_upload.${extension}`;
                const presignedPutUrl = yield this.presignedPutObject(uploadFileName);
                return {
                    extension,
                    type,
                    fileName,
                    uploadFileName,
                    presignedPutUrl
                };
            }),
            '@fullstack-one/file-storage/verifyFile': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const fileName = args.fileName;
                const fileNameWithoutExtension = fileName.split('.')[0].split('_');
                const fileId = fileNameWithoutExtension[0];
                const fileType = fileNameWithoutExtension[1];
                const extension = fileName.split('.')[1];
                const uploadFileName = `${fileId}_${fileType}_upload.${extension}`;
                const result = yield this.auth.userQuery(context.accessToken, 'SELECT _meta.file_get_type_to_verify($1) AS "type";', [fileId]);
                const type = result.rows[0].type;
                let stat = null;
                if (this.verifierObjects[type] == null) {
                    throw new Error(`A verifier for type '${type}' hasn't been defined.`);
                }
                if (type !== fileType) {
                    throw new Error(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`);
                }
                try {
                    stat = yield this.client.statObject(this.fileStorageConfig.bucket, uploadFileName);
                }
                catch (e) {
                    if (e.message.toLowerCase().indexOf('not found') >= 0) {
                        throw new Error('Please upload a file before verifying.');
                    }
                    throw e;
                }
                const verifyFileName = `${fileId}_temp_${Date.now()}_${Math.round(Math.random() * 100000000000)}.${extension}`;
                const verifyCopyConditions = new Minio.CopyConditions();
                verifyCopyConditions.setMatchETag(stat.etag);
                yield this.client.copyObject(this.fileStorageConfig.bucket, verifyFileName, `/${this.fileStorageConfig.bucket}/${uploadFileName}`, verifyCopyConditions);
                yield this.verifierObjects[type].verify(verifyFileName, fileId, fileType, extension);
                yield this.auth.userQuery(context.accessToken, 'SELECT _meta.file_verify($1);', [fileId]);
                // Try to clean up temp objects. However, don't care if it fails.
                try {
                    yield this.client.removeObjects(this.fileStorageConfig.bucket, [uploadFileName, verifyFileName]);
                }
                catch (err) {
                    this.logger.warn('verifyFile.removeObjectsFail', err);
                }
                const objectNames = this.verifierObjects[fileType].getObjectNames(fileId, fileType, extension);
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
                        this.logger.warn('readFiles.signFail.promise', err);
                    }
                }
                return {
                    fileName,
                    objects: bucketObjects
                };
            }),
            '@fullstack-one/file-storage/clearUpFiles': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                let result;
                if (args.fileName != null) {
                    const fileId = args.fileName.split('.')[0];
                    result = yield this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearupone($1);', [fileId]);
                }
                else {
                    result = yield this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearup();');
                }
                const filesDeleted = result.rows.map(row => `${row.id}_${row.type}.${row.extension}`);
                filesDeleted.forEach((fileName) => {
                    this.deleteFile(fileName, context);
                });
                return filesDeleted;
            }),
            '@fullstack-one/file-storage/readFiles': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const awaitingFileSignatures = [];
                if (obj[info.fieldName] == null) {
                    return [];
                }
                const data = obj[info.fieldName];
                for (const fileName of data) {
                    try {
                        const splittedFileName = fileName.split('.');
                        const fileNameWithoutExtension = splittedFileName[0].split('_');
                        const fileId = fileNameWithoutExtension[0];
                        const fileType = fileNameWithoutExtension[1];
                        const extension = splittedFileName[1];
                        const objectNames = this.verifierObjects[fileType].getObjectNames(fileId, fileType, extension);
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
                        this.logger.warn('readFiles.signFail', err);
                    }
                }
                const results = [];
                for (const fileObject of awaitingFileSignatures) {
                    try {
                        const objects = [];
                        // const presignedGetUrl = await fileObject.presignedGetUrlPromise;
                        const fileName = fileObject.fileName;
                        for (const object of fileObject.files) {
                            try {
                                objects.push({
                                    objectName: object.objectName,
                                    info: object.info,
                                    presignedGetUrl: yield object.presignedGetUrlPromise
                                });
                            }
                            catch (err) {
                                this.logger.warn('readFiles.signFail.promise', err);
                            }
                        }
                        results.push({
                            fileName,
                            objects
                        });
                    }
                    catch (err) {
                        // Errors can be ignored => Failed Signs are not returned
                        this.logger.warn('readFiles.signFail.promise', err);
                    }
                }
                return results;
            })
        };
    }
};
FileStorage = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => db_1.DbGeneralPool)),
    __param(2, di_1.Inject(type => server_1.Server)),
    __param(3, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(4, di_1.Inject(type => config_1.Config)),
    __param(5, di_1.Inject(type => graphql_1.GraphQl)),
    __param(6, di_1.Inject(type => schema_builder_1.SchemaBuilder)),
    __param(7, di_1.Inject(type => auth_1.Auth)),
    __metadata("design:paramtypes", [logger_1.LoggerFactory, Object, Object, Object, Object, Object, Object, Object])
], FileStorage);
exports.FileStorage = FileStorage;
