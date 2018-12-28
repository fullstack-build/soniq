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
const boot_loader_1 = require("@fullstack-one/boot-loader");
const schema_builder_1 = require("@fullstack-one/schema-builder");
const config_1 = require("@fullstack-one/config");
const graphql_1 = require("@fullstack-one/graphql");
const logger_1 = require("@fullstack-one/logger");
const auth_1 = require("@fullstack-one/auth");
const fbHelper_1 = require("./fbHelper");
const fs = require("fs");
const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");
let AuthFbToken = class AuthFbToken {
    constructor(auth, bootLoader, schemaBuilder, config, graphQl, loggerFactory) {
        // register package config
        this.authFbTokenConfig = config.registerConfig("AuthFbToken", `${__dirname}/../config`);
        // DI
        this.loggerFactory = loggerFactory;
        this.auth = auth;
        this.config = config;
        this.logger = this.loggerFactory.create(this.constructor.name);
        // add to boot loader
        bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
        schemaBuilder.extendSchema(schema);
        graphQl.addResolvers(this.getResolvers());
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fbHelper = new fbHelper_1.FbHelper(this.authFbTokenConfig, this.logger);
            return;
        });
    }
    getResolvers() {
        return {
            "@fullstack-one/auth-fb-token/createAuthTokenFromFacebookToken": (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                // If the privacy token is not valid, this function will throw an error and we will not proceed any data.
                this.auth.validatePrivacyAgreementAcceptanceToken(args.privacyAgreementAcceptanceToken);
                // Get the facebook profile information.
                const profile = yield this.fbHelper.getProfile(args.token);
                const email = profile.email;
                const providerName = "facebookToken";
                const profileId = profile.id;
                // Create an auth-token for login and registration
                return this.auth.createAuthToken(args.privacyAgreementAcceptanceToken, email, providerName, profileId, args.tenant || "default", profile);
            })
        };
    }
};
AuthFbToken = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => auth_1.Auth)),
    __param(1, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(2, di_1.Inject((type) => schema_builder_1.SchemaBuilder)),
    __param(3, di_1.Inject((type) => config_1.Config)),
    __param(4, di_1.Inject((type) => graphql_1.GraphQl)),
    __param(5, di_1.Inject((type) => logger_1.LoggerFactory)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, logger_1.LoggerFactory])
], AuthFbToken);
exports.AuthFbToken = AuthFbToken;
