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
const graphql_parser_1 = require("@fullstack-one/graphql-parser");
const KoaRouter = require("koa-router");
const koaBody = require("koa-bodyparser");
const Minio = require("minio");
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
const fs = require("fs");
const schema = fs.readFileSync(require.resolve('./schema.gql'), 'utf-8');
let FileStorage = class FileStorage {
    constructor(dbGeneralPool, server, bootLoader, config, graphQl, graphQlParser) {
        this.server = server;
        this.dbGeneralPool = dbGeneralPool;
        this.graphQl = graphQl;
        this.graphQlParser = graphQlParser;
        this.fileStorageConfig = config.getConfig('fileStorage');
        this.client = new Minio.Client(this.fileStorageConfig.minio);
        this.graphQlParser.extendSchema(schema);
        this.graphQl.addResolvers(this.getResolvers());
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
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
    getResolvers() {
        return {
            '@fullstack-one/file-storage/createFile': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                return {
                    extension: 'png',
                    name: 'testimage',
                    putUrl: 'http://minio.put.de/',
                    getUrl: 'http://minio.get.de/',
                    bucket: 'fullstackTestBucket',
                    object: 'testimage',
                    ownerUserId: 'ux4',
                    createdAt: 'Yesterday'
                };
            })
        };
    }
};
FileStorage = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => db_1.DbGeneralPool)),
    __param(1, di_1.Inject(type => server_1.Server)),
    __param(2, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject(type => config_1.Config)),
    __param(4, di_1.Inject(type => graphql_1.GraphQl)),
    __param(5, di_1.Inject(type => graphql_parser_1.GraphQlParser)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], FileStorage);
exports.FileStorage = FileStorage;
/*
const Minio = require('minio')

var client = new Minio.Client({
    endPoint: 'play.minio.io',
    port: 9000,
    secure: true,
    accessKey: 'Q3AM3UQ867SPQQA43P2F',
    secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
})

// express is a small HTTP server wrapper, but this works with any HTTP server
const server = require('express')()

server.get('/presignedUrl', (req, res) => {
    client.presignedPutObject('bauhaus', req.query.name, (err, url) => {
        if (err) throw err
        res.end(url)
    })
})

server.get('/presignedGetUrl', (req, res) => {
    client.presignedGetObject('bauhaus', req.query.name, 24*60*60, (err, url) => {
        if (err) throw err
        res.end(url)
    })
})

server.get('/image/:name', (req, res) => {
    client.presignedGetObject('bauhaus', req.params.name, 4*60, (err, url) => {
        if (err) throw err
        res.redirect(url)
    })
})

server.get('/', (req, res) => {
    res.sendFile(__dirname + '/test.html');
})
*/
