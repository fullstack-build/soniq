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
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
const db_1 = require("@fullstack-one/db");
const server_1 = require("@fullstack-one/server");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const schema_builder_1 = require("@fullstack-one/schema-builder");
const config_1 = require("@fullstack-one/config");
const graphql_1 = require("@fullstack-one/graphql");
const logger_1 = require("@fullstack-one/logger");
const crypto_1 = require("./crypto");
const signHelper_1 = require("./signHelper");
const passport = require("koa-passport");
const KoaRouter = require("koa-router");
const koaBody = require("koa-bodyparser");
const koaSession = require("koa-session");
const koaCors = require("@koa/cors");
const oAuthCallback_1 = require("./oAuthCallback");
const migrationHelper_1 = require("./migrationHelper");
const getParser_1 = require("./getParser");
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
const fs = require("fs");
const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');
// export
__export(require("./signHelper"));
let Auth = class Auth {
    constructor(dbGeneralPool, server, bootLoader, schemaBuilder, config, graphQl, loggerFactory) {
        this.dbData = {
            schema: null,
            table: null,
            username: null,
            password: null,
            tenant: null
        };
        this.parserMeta = {};
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        this.logger = loggerFactory.create('Auth');
        // DI
        this.server = server;
        this.dbGeneralPool = dbGeneralPool;
        this.graphQl = graphQl;
        this.schemaBuilder = schemaBuilder;
        this.authConfig = config.getConfig('auth');
        this.sodiumConfig = crypto_1.createConfig(this.authConfig.sodium);
        this.notificationFunction = (caller, user, meta) => __awaiter(this, void 0, void 0, function* () {
            throw new Error('No notification function has been defined.');
        });
        graphQl.addHook('preQuery', this.preQueryHook.bind(this));
        graphQl.addHook('preMutationCommit', this.preMutationCommitHook.bind(this));
        this.addMiddleware();
        // add to boot loader
        bootLoader.addBootFunction(this.boot.bind(this));
        this.schemaBuilder.extendSchema(schema);
        this.schemaBuilder.addParser(getParser_1.getParser((key, value) => {
            this.parserMeta[key] = value;
        }));
        this.graphQl.addResolvers(this.getResolvers());
        // add migration path
        this.schemaBuilder.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');
        // register directive parser
        // require('./migrationHelper');
        // register Auth migration directive parser
        migrationHelper_1.setDirectiveParser(schema_builder_1.registerDirectiveParser);
        // this.linkPassport();
    }
    setNotificationFunction(notificationFunction) {
        if (notificationFunction == null || typeof notificationFunction !== 'function') {
            throw new Error('The notification function needs to be an async function.');
        }
        this.notificationFunction = notificationFunction;
    }
    setUser(client, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            try {
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];
                yield client.query('SELECT _meta.set_user_token($1, $2, $3, $4);', values);
                return true;
            }
            catch (err) {
                this.logger.warn('setUser.error', err);
                throw err;
            }
        });
    }
    setAdmin(client) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield client.query(`SET LOCAL auth.admin_token TO '${signHelper_1.getAdminSignature(this.authConfig.secrets.admin)}';`);
                return client;
            }
            catch (err) {
                this.logger.warn('setAdmin.error', err);
                throw err;
            }
        });
    }
    unsetAdmin(client) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield client.query(`RESET auth.admin_token;`);
                return client;
            }
            catch (err) {
                this.logger.warn('unsetAdmin.error', err);
                throw err;
            }
        });
    }
    initializeUser(client, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.setAdmin(client);
                const result = yield client.query('SELECT _meta.initialize_user($1) AS payload', [userId]);
                yield this.unsetAdmin(client);
                const payload = result.rows[0].payload;
                const user = {
                    userId: payload.userId,
                    payload,
                    accessToken: signHelper_1.signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
                };
                return user;
            }
            catch (err) {
                this.logger.warn('initializeUser.error', err);
                throw err;
            }
        });
    }
    login(username, tenant, password, authToken, clientIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            let authTokenPayload = {};
            let provider = 'local';
            if (authToken != null) {
                try {
                    authTokenPayload = signHelper_1.verifyJwt(this.authConfig.secrets.authToken, authToken);
                    provider = authTokenPayload.providerName;
                }
                catch (err) {
                    throw new Error('Failed to verify auth-token.');
                }
            }
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const metaResult = yield client.query('SELECT _meta.get_user_pw_meta($1, $2, $3) AS data', [username, provider, tenant]);
                const data = metaResult.rows[0].data;
                let uid = data.userId;
                let pw = password;
                if (authToken != null) {
                    uid = authTokenPayload.profileId;
                    pw = authTokenPayload.providerName;
                }
                const providerSignature = signHelper_1.getProviderSignature(this.authConfig.secrets.admin, provider, uid);
                const pwData = yield crypto_1.hashByMeta(pw + providerSignature, data.pwMeta);
                yield this.setAdmin(client);
                const loginResult = yield client.query('SELECT _meta.login($1, $2, $3, $4) AS payload', [data.userId, provider, pwData.hash, clientIdentifier]);
                const payload = loginResult.rows[0].payload;
                const ret = {
                    userId: data.userId,
                    payload,
                    accessToken: signHelper_1.signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds),
                    refreshToken: null
                };
                if (payload.refreshToken != null) {
                    const refreshTokenPayload = {
                        token: payload.refreshToken
                    };
                    ret.refreshToken = signHelper_1.signJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenPayload, payload.userTokenMaxAgeInSeconds);
                }
                yield client.query('COMMIT');
                return ret;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('login.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    refreshUserToken(accessToken, refreshTokenJwt, clientIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const refreshToken = signHelper_1.verifyJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenJwt).token;
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, clientIdentifier, refreshToken];
                const result = yield client.query('SELECT _meta.refresh_user_token($1, $2, $3, $4, $5, $6) AS payload', values);
                const newPayload = result.rows[0].payload;
                const ret = {
                    userId: newPayload.userId,
                    payload: newPayload,
                    accessToken: signHelper_1.signJwt(this.authConfig.secrets.jwt, newPayload, newPayload.userTokenMaxAgeInSeconds),
                    refreshToken: null
                };
                if (newPayload.refreshToken != null) {
                    const refreshTokenPayload = {
                        token: newPayload.refreshToken
                    };
                    ret.refreshToken = signHelper_1.signJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenPayload, newPayload.userTokenMaxAgeInSeconds);
                }
                yield client.query('COMMIT');
                return ret;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('refreshUserToken.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    createSetPasswordValues(accessToken, provider, password, userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const uid = userIdentifier || payload.userId;
            const providerSignature = signHelper_1.getProviderSignature(this.authConfig.secrets.admin, provider, uid);
            const pwData = yield crypto_1.newHash(password + providerSignature, this.sodiumConfig);
            const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider, pwData.hash, JSON.stringify(pwData.meta)];
            return values;
        });
    }
    setPasswordWithClient(accessToken, provider, password, userIdentifier, client) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield this.createSetPasswordValues(accessToken, provider, password, userIdentifier);
            yield this.setAdmin(client);
            yield client.query('SELECT _meta.set_password($1, $2, $3, $4, $5, $6, $7) AS payload', values);
            yield this.unsetAdmin(client);
        });
    }
    setPassword(accessToken, provider, password, userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield this.createSetPasswordValues(accessToken, provider, password, userIdentifier);
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                yield client.query('SELECT _meta.set_password($1, $2, $3, $4, $5, $6, $7) AS payload', values);
                yield client.query('COMMIT');
                return true;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('setPassword.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    forgotPassword(username, tenant, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const result = yield client.query('SELECT _meta.forgot_password($1, $2) AS data', [username, tenant]);
                const payload = result.rows[0].data;
                const user = {
                    userId: payload.userId,
                    payload,
                    username,
                    tenant,
                    accessToken: signHelper_1.signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
                };
                yield this.notificationFunction(user, 'FORGOT_PASSWORD', meta);
                yield client.query('COMMIT');
                return true;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('forgotPassword.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    removeProvider(accessToken, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider];
                yield client.query('SELECT _meta.remove_provider($1, $2, $3, $4, $5) AS data', values);
                yield client.query('COMMIT');
                return true;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('removeProvider.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    getTokenMeta(accessToken, tempSecret = false, tempTime = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, tempSecret, tempTime];
                const result = yield client.query('SELECT _meta.is_user_token_valid($1, $2, $3, $4, $5, $6) AS data', values);
                const isValid = result.rows[0].data === true;
                const ret = {
                    isValid,
                    userId: payload.userId,
                    provider: payload.provider,
                    timestamp: payload.timestamp,
                    issuedAt: payload.iat,
                    expiresAt: payload.exp
                };
                yield client.query('COMMIT');
                return ret;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('getTokenMeta.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    invalidateUserToken(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];
                yield client.query('SELECT _meta.invalidate_user_token($1, $2, $3, $4) AS data', values);
                yield client.query('COMMIT');
                return true;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('invalidateUserToken.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    invalidateAllUserTokens(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = signHelper_1.verifyJwt(this.authConfig.secrets.jwt, accessToken);
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];
                yield client.query('SELECT _meta.invalidate_all_user_tokens($1, $2, $3, $4) AS data', values);
                yield client.query('COMMIT');
                return true;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('invalidateAllUserTokens.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    getPassport() {
        return passport;
    }
    /* DB HELPER START */
    createDbClientAdminTransaction(dbClient) {
        return __awaiter(this, void 0, void 0, function* () {
            // Begin transaction
            yield dbClient.query('BEGIN');
            const SECRET = this.authConfig.secrets.admin;
            yield dbClient.query(`SET LOCAL auth.admin_token TO '${signHelper_1.getAdminSignature(SECRET)}'`);
            return dbClient;
        });
    }
    createDbClientUserTransaction(dbClient, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Begin transaction
            yield dbClient.query('BEGIN');
            // set user for dbClient
            yield this.setUser(dbClient, accessToken);
            return dbClient;
        });
    }
    getCurrentUserIdFromClient(dbClient) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield dbClient.query('SELECT _meta.current_user_id();')).rows[0].current_user_id;
        });
    }
    getCurrentUserIdFromAccessToken(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            // set user for dbClient
            yield this.setUser(client, accessToken);
            // get user ID from DB Client
            let userId = null;
            try {
                userId = yield this.getCurrentUserIdFromClient(client);
            }
            catch ( /*ignore error, return empty userId */_a) { /*ignore error, return empty userId */ }
            // Release pgClient to pool
            yield client.release();
            return userId;
        });
    }
    adminTransaction(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                const ret = yield callback(client);
                yield client.query('COMMIT');
                return ret;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('adminTransaction.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    adminQuery(...queryArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setAdmin(client);
                // run query
                const result = yield client.query.apply(client, queryArguments);
                yield client.query('COMMIT');
                return result;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('adminQuery.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    userTransaction(accessToken, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setUser(client, accessToken);
                const ret = yield callback(client);
                yield client.query('COMMIT');
                return ret;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('userTransaction.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    userQuery(accessToken, ...queryArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                yield this.setUser(client, accessToken);
                const result = yield client.query.apply(client, queryArguments);
                yield client.query('COMMIT');
                return result;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                this.logger.warn('userQuery.error', err);
                throw err;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    }
    /* DB HELPER END */
    addMiddleware() {
        const app = this.server.getApp();
        // If app.proxy === true koa will respect x-forwarded headers
        app.proxy = this.authConfig.isServerBehindProxy === true ? true : false;
        // Prevent CSRF
        app.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
            ctx.securityContext = {
                isBrowser: true,
                isApiClient: false,
                clientIdentifier: null,
                sameOriginApproved: {
                    byReferrer: false,
                    byOrigin: false,
                    byHost: false
                }
            };
            // Generate clientIdentifier for refresh-token
            if (ctx.request.ip != null && ctx.request.headers['user-agent'] != null) {
                ctx.securityContext.clientIdentifier = crypto_1.sha256(`${ctx.request.ip}_#_${ctx.request.headers['user-agent']}`);
            }
            // Check if https is used on production
            if (process.env.NODE_ENV === 'production') {
                if (this.authConfig.enforceHttpsOnProduction !== false && ctx.request.protocol !== 'https') {
                    return ctx.throw(400, 'Unsecure requests are not allowed here. Please use HTTPS.');
                }
            }
            const origin = ctx.request.get('origin');
            const referrer = ctx.request.get('referrer');
            const host = ctx.request.get('host');
            // Validate same origin policy
            if (ctx.request.origin != null && this.authConfig.validOrigins.includes(ctx.request.origin)) {
                if (referrer.startsWith(ctx.request.origin + '/') || referrer === ctx.request.origin) {
                    ctx.securityContext.sameOriginApproved.byReferrer = true;
                }
                if (origin === ctx.request.origin) {
                    ctx.securityContext.sameOriginApproved.byOrigin = true;
                }
                if (host === ctx.request.host) {
                    ctx.securityContext.sameOriginApproved.byHost = true;
                }
            }
            // If the client is no Browser we don't need to worry about cors.
            if (origin === this.authConfig.apiClientOrigin) {
                ctx.securityContext.isApiClient = true;
                ctx.securityContext.isBrowser = false;
            }
            if (ctx.securityContext.isBrowser === true) {
                if (ctx.securityContext.sameOriginApproved.byOrigin === true &&
                    ctx.securityContext.sameOriginApproved.byReferrer === true &&
                    ctx.securityContext.sameOriginApproved.byHost === true) {
                    return next();
                }
                if (ctx.request.method === 'GET') {
                    if (ctx.securityContext.sameOriginApproved.byHost === true) {
                        return next();
                    }
                    if (ctx.securityContext.sameOriginApproved.byOrigin === true &&
                        ctx.securityContext.sameOriginApproved.byReferrer === true) {
                        return next();
                    }
                }
            }
            else {
                return next();
            }
            return ctx.throw(400, 'Origin of the request is not allowed.');
        }));
        const corsOptions = Object.assign({}, this.authConfig.corsOptions, {
            origin: (ctx) => {
                if (process.env.NODE_ENV === 'production') {
                    return ctx.request.origin;
                }
                if (this.authConfig.allowAllCorsOriginsOnDev === true) {
                    return '*';
                }
                return ctx.request.origin;
            }
        });
        app.use(koaCors(corsOptions));
        // Parse AccessToken
        app.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
            // Token transfer over auhorization header and query parameter is not allowed for browsers.
            if (ctx.securityContext.isApiClient === true) {
                if (this.authConfig.tokenQueryParameter != null && ctx.request.query[this.authConfig.tokenQueryParameter] != null) {
                    ctx.state.accessToken = ctx.request.query[this.authConfig.tokenQueryParameter];
                    return next();
                }
                if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith('Bearer ')) {
                    ctx.state.accessToken = ctx.request.header.authorization.slice(7);
                    return next();
                }
            }
            const accessToken = ctx.cookies.get(this.authConfig.cookie.name, this.authConfig.cookie);
            if (accessToken != null) {
                ctx.state.accessToken = accessToken;
            }
            return next();
        }));
    }
    findAuthTableAndFields(dbMeta) {
        Object.keys(dbMeta.schemas).forEach((schemaName) => {
            const schemaObject = dbMeta.schemas[schemaName];
            Object.keys(schemaObject.tables).forEach((tableName) => {
                const tableObject = schemaObject.tables[tableName];
                if (tableObject.extensions != null && tableObject.extensions.isAuth === true) {
                    this.dbData.table = tableObject.name;
                    this.dbData.schema = tableObject.schemaName;
                    Object.keys(tableObject.columns).forEach((columnName) => {
                        const columnObject = tableObject.columns[columnName];
                        if (columnObject.extensions != null && columnObject.extensions.auth != null) {
                            if (columnObject.extensions.auth.isUsername === true) {
                                this.dbData.username = columnObject.name;
                            }
                            if (columnObject.extensions.auth.isPassword === true) {
                                this.dbData.password = columnObject.name;
                            }
                            if (columnObject.extensions.auth.isTenant === true) {
                                this.dbData.tenant = columnObject.name;
                            }
                        }
                    });
                    return;
                }
            });
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbMeta = this.schemaBuilder.getDbMeta();
            this.findAuthTableAndFields(dbMeta);
            const authRouter = new KoaRouter();
            const app = this.server.getApp();
            authRouter.use(koaBody());
            app.keys = [this.authConfig.secrets.cookie];
            authRouter.use(koaSession(this.authConfig.oAuth.cookie, app));
            authRouter.use(passport.initialize());
            authRouter.get('/auth/oAuthFailure', (ctx) => __awaiter(this, void 0, void 0, function* () {
                const message = {
                    err: 'ERROR_AUTH',
                    data: null
                };
                ctx.body = oAuthCallback_1.default(message, this.authConfig.oAuth.frontendOrigins);
            }));
            authRouter.get('/auth/oAuthFailure/:err', (ctx) => __awaiter(this, void 0, void 0, function* () {
                const message = {
                    err: ctx.params.err,
                    data: null
                };
                ctx.body = oAuthCallback_1.default(message, this.authConfig.oAuth.frontendOrigins);
            }));
            authRouter.get('/auth/oAuthSuccess/:data', (ctx) => __awaiter(this, void 0, void 0, function* () {
                const message = {
                    err: null,
                    data: JSON.parse(ctx.params.data)
                };
                ctx.body = oAuthCallback_1.default(message, this.authConfig.oAuth.frontendOrigins);
            }));
            Object.keys(this.authConfig.oAuth.providers).forEach((key) => {
                const provider = this.authConfig.oAuth.providers[key];
                const callbackPath = '/auth/oAuthCallback/' + key;
                const serverApiAddress = this.authConfig.oAuth.serverApiAddress;
                const callbackURL = serverApiAddress + callbackPath;
                const providerConfig = Object.assign({}, provider.config, { callbackURL });
                const providerOptions = Object.assign({ scope: ['email'] }, provider.options, { session: false });
                passport.use(new provider.strategy(providerConfig, (accessToken, refreshToken, profile, cb) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let email = profile.email || profile._json.email;
                        if (email == null && profile.emails != null && profile.emails[0] != null && profile.emails[0].value != null) {
                            email = profile.emails[0].value;
                        }
                        if (profile == null || email == null || profile.id == null) {
                            throw new Error('Email or id is missing!');
                        }
                        const authTokenPayload = {
                            providerName: provider.name,
                            profileId: profile.id,
                            email,
                            tenant: provider.tenant || 'default',
                            profile
                        };
                        const response = {
                            authTokenPayload,
                            authToken: signHelper_1.signJwt(this.authConfig.secrets.authToken, authTokenPayload, this.authConfig.authToken.maxAgeInSeconds)
                        };
                        cb(null, response);
                    }
                    catch (err) {
                        this.logger.warn('passport.strategylogin.error', err);
                        cb(err);
                    }
                })));
                authRouter.get('/auth/oAuth/' + key, (ctx, next) => {
                    const { queryParameter } = this.authConfig.privacy;
                    if (this.isPrivacyPolicyCheckActive() === true) {
                        let tokenPayload;
                        if (ctx.request.query == null || ctx.request.query[queryParameter] == null) {
                            this.logger.warn('passport.oAuthFailure.error.missingPrivacyToken');
                            return ctx.redirect('/auth/oAuthFailure/' + encodeURIComponent(`Missing privacy token query parameter. '${queryParameter}'`));
                        }
                        try {
                            tokenPayload = signHelper_1.verifyJwt(this.authConfig.secrets.privacyToken, ctx.request.query[queryParameter]);
                        }
                        catch (e) {
                            this.logger.warn('passport.oAuthFailure.error.invalidPrivacyToken');
                            return ctx.redirect('/auth/oAuthFailure/' + encodeURIComponent('Invalid privacy token.'));
                        }
                        if (tokenPayload.acceptedVersion !== this.authConfig.privacy.versionToAccept) {
                            throw new Error(`The accepted version is not version '${this.authConfig.privacy.versionToAccept}'.`);
                        }
                    }
                    next();
                }, passport.authenticate(provider.name, providerOptions));
                const errorCatcher = (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield next();
                    }
                    catch (err) {
                        this.logger.warn('passport.oAuthFailure.error', err);
                        ctx.redirect('/auth/oAuthFailure');
                    }
                });
                // tslint:disable-next-line:max-line-length
                authRouter.get(callbackPath, errorCatcher, passport.authenticate(provider.name, { failureRedirect: '/auth/oAuthFailure', session: false }), (ctx) => {
                    ctx.redirect('/auth/oAuthSuccess/' + encodeURIComponent(JSON.stringify(ctx.state.user)));
                });
            });
            app.use(authRouter.routes());
            app.use(authRouter.allowedMethods());
        });
    }
    preQueryHook(client, context, authRequired) {
        return __awaiter(this, void 0, void 0, function* () {
            if (authRequired === true && context.accessToken != null) {
                yield this.setUser(client, context.accessToken);
            }
        });
    }
    preMutationCommitHook(client, hookInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const mutation = hookInfo.mutationQuery.mutation;
            if (mutation.type === 'CREATE' && mutation.tableName === this.dbData.table) {
                const args = hookInfo.args;
                const ctx = hookInfo.context.ctx;
                const meta = args.meta || null;
                if (this.isPrivacyPolicyCheckActive() === true) {
                    const { privacyPolicyAcceptedAtInUTC, privacyPolicyAcceptedVersion } = this.parserMeta;
                    let tokenPayload;
                    if (args.input[privacyPolicyAcceptedAtInUTC] == null || args.input[privacyPolicyAcceptedVersion] == null) {
                        throw new Error(`The privacy-fields ('${privacyPolicyAcceptedAtInUTC}',` +
                            ` '${privacyPolicyAcceptedVersion}') are required for creating a user.`);
                    }
                    if (args.privacyToken == null) {
                        throw new Error(`Missing privacyToken argument.`);
                    }
                    try {
                        tokenPayload = signHelper_1.verifyJwt(this.authConfig.secrets.privacyToken, args.privacyToken);
                    }
                    catch (e) {
                        throw new Error('Invalid privacy token.');
                    }
                    if (tokenPayload.acceptedAtInUTC !== args.input[privacyPolicyAcceptedAtInUTC]
                        || tokenPayload.acceptedVersion !== args.input[privacyPolicyAcceptedVersion]) {
                        throw new Error(`The privacy-fields ('${privacyPolicyAcceptedAtInUTC}',` +
                            ` '${privacyPolicyAcceptedVersion}') must match the payload of the privacy-token.`);
                    }
                    if (tokenPayload.acceptedVersion !== this.authConfig.privacy.versionToAccept) {
                        throw new Error(`The accepted version of your privacy-token is not version '${this.authConfig.privacy.versionToAccept}'.`);
                    }
                }
                const user = yield this.initializeUser(client, hookInfo.entityId);
                const notificationContext = {
                    user,
                    input: args.input,
                    tokenPayload: null
                };
                if (args.authToken != null) {
                    let tokenPayload;
                    try {
                        tokenPayload = signHelper_1.verifyJwt(this.authConfig.secrets.authToken, args.authToken);
                    }
                    catch (e) {
                        throw new Error('Failed to verify auth-token.');
                    }
                    if (tokenPayload.email !== user.payload.username) {
                        throw new Error(`The authToken email does not match username.`);
                    }
                    notificationContext.tokenPayload = tokenPayload;
                    // console.log('SET PW', user.accessToken, user.payload.provider, tokenPayload.providerName, tokenPayload.profileId);
                    yield this.setPasswordWithClient(user.accessToken, tokenPayload.providerName, tokenPayload.providerName, tokenPayload.profileId, client);
                    yield this.notificationFunction('REGISTER_OAUTH', notificationContext);
                }
                else {
                    yield this.notificationFunction('REGISTER', notificationContext);
                }
            }
        });
    }
    createPrivacyToken(acceptedVersion) {
        if (acceptedVersion !== this.authConfig.privacy.versionToAccept) {
            throw new Error(`The accepted version is not version '${this.authConfig.privacy.versionToAccept}'.`);
        }
        const acceptedAtInUTC = new Date().toISOString();
        const payload = {
            acceptedVersion,
            acceptedAtInUTC
        };
        const privacyToken = signHelper_1.signJwt(this.authConfig.secrets.privacyToken, payload, this.authConfig.privacy.tokenMaxAgeInSeconds);
        return {
            privacyToken,
            acceptedVersion,
            acceptedAtInUTC
        };
    }
    isPrivacyPolicyCheckActive() {
        return this.parserMeta.privacyPolicyAcceptedAtInUTC != null && this.parserMeta.privacyPolicyAcceptedVersion != null;
    }
    getResolvers() {
        return {
            '@fullstack-one/auth/login': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const clientIdentifier = context.ctx.securityContext.clientIdentifier;
                const lData = yield this.login(args.username, args.tenant || 'default', args.password, args.authToken, clientIdentifier);
                if (context.ctx.securityContext.isBrowser === true) {
                    context.ctx.cookies.set(this.authConfig.cookie.name, lData.accessToken, this.authConfig.cookie);
                    return {
                        userId: lData.userId,
                        refreshToken: lData.refreshToken || null,
                        sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
                    };
                }
                else {
                    return Object.assign({}, lData, {
                        sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
                    });
                }
            }),
            '@fullstack-one/auth/forgotPassword': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                return yield this.forgotPassword(args.username, args.tenant || 'default', args.meta || null);
            }),
            '@fullstack-one/auth/setPassword': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const accessToken = args.accessToken || context.accessToken;
                return yield this.setPassword(accessToken, 'local', args.password, null);
            }),
            '@fullstack-one/auth/getTokenMeta': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const accessToken = args.accessToken || context.accessToken;
                const tempToken = args.tempToken || false;
                const tempTokenExpiration = args.tempTokenExpiration || false;
                return yield this.getTokenMeta(accessToken, tempToken, tempTokenExpiration);
            }),
            '@fullstack-one/auth/invalidateUserToken': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const accessToken = context.accessToken;
                context.ctx.cookies.set(this.authConfig.cookie.name, null);
                return yield this.invalidateUserToken(accessToken);
            }),
            '@fullstack-one/auth/invalidateAllUserTokens': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const accessToken = context.accessToken;
                context.ctx.cookies.set(this.authConfig.cookie.name, null);
                return yield this.invalidateAllUserTokens(accessToken);
            }),
            '@fullstack-one/auth/refreshUserToken': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                const clientIdentifier = context.ctx.securityContext.clientIdentifier;
                const accessToken = context.accessToken;
                const lData = yield this.refreshUserToken(accessToken, args.refreshToken, clientIdentifier);
                if (context.ctx.securityContext.isBrowser === true) {
                    context.ctx.cookies.set(this.authConfig.cookie.name, lData.accessToken, this.authConfig.cookie);
                    return {
                        userId: lData.userId,
                        refreshToken: lData.refreshToken || null,
                        sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
                    };
                }
                else {
                    return Object.assign({}, lData, {
                        sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
                    });
                }
            }),
            '@fullstack-one/auth/createPrivacyToken': (obj, args, context, info, params) => __awaiter(this, void 0, void 0, function* () {
                return this.createPrivacyToken(args.acceptedVersion);
            })
        };
    }
};
Auth = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => db_1.DbGeneralPool)),
    __param(1, di_1.Inject(type => server_1.Server)),
    __param(2, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject(type => schema_builder_1.SchemaBuilder)),
    __param(4, di_1.Inject(type => config_1.Config)),
    __param(5, di_1.Inject(type => graphql_1.GraphQl)),
    __param(6, di_1.Inject(type => logger_1.LoggerFactory)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, logger_1.LoggerFactory])
], Auth);
exports.Auth = Auth;
