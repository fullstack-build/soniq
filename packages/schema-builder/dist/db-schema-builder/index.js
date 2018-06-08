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
const _ = require("lodash");
const fastGlob = require("fast-glob");
const fs = require("fs");
const deep_diff_1 = require("deep-diff");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const di_1 = require("@fullstack-one/di");
const config_1 = require("@fullstack-one/config");
const logger_1 = require("@fullstack-one/logger");
const db_1 = require("@fullstack-one/db");
const migrationObject_1 = require("./migrationObject");
const createViewsFromDbMeta_1 = require("./createViewsFromDbMeta");
const createSqlObjFromMigrationObject_1 = require("./toPg/createSqlObjFromMigrationObject");
let DbSchemaBuilder = class DbSchemaBuilder {
    constructor(bootLoader, config, loggerFactory, dbAppClient) {
        this.initSqlPaths = [__dirname + '/../..'];
        // create logger
        this.logger = loggerFactory.create('DbSchemaBuilder');
        this.dbAppClient = dbAppClient;
        this.config = config;
        this.dbConfig = config.getConfig('db');
        // add to boot loader
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    // add paths with migration sql scripts
    addMigrationPath(path) {
        this.initSqlPaths.push(path);
    }
    getMigrationDbMeta() {
        return _.cloneDeep(this.migrationObject);
    }
    // run packages migration scripts based on initiated version
    initDb() {
        return __awaiter(this, void 0, void 0, function* () {
            // get DB pgClient from DI container
            const dbAppClient = di_1.Container.get(db_1.DbAppClient);
            const dbClient = dbAppClient.pgClient;
            // check latest version migrated
            let latestVersion = 0;
            try {
                const dbInitVersion = (yield dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0];
                if (dbInitVersion != null && dbInitVersion.value != null) {
                    latestVersion = parseInt(dbInitVersion.value, 10);
                    this.logger.debug('migration.db.init.version.detected', latestVersion);
                }
            }
            catch (err) {
                this.logger.info('migration.db.init.not.found');
            }
            // find init scripts to ignore (version lower than the current one)
            const initSqlFolders = [];
            // run through all registered packages
            this.initSqlPaths.map((initSqlPath) => {
                // find all init_sql folders
                fastGlob.sync(`${initSqlPath}/sql/[0-9]*`, {
                    deep: false,
                    onlyDirectories: true,
                }).map((path) => {
                    const pathVersion = parseInt(path.toString().split('/').pop(), 10);
                    // keep only those with a higher version than the currently installed
                    if (latestVersion < pathVersion) {
                        initSqlFolders.push(path);
                    }
                });
            });
            // iterate all active paths and collect all files grouped by types (suffix)
            const loadFilesOrder = {};
            // suffix types
            const loadSuffixOrder = ['extension', 'schema', 'table', 'function', 'set', 'insert', 'select'];
            // will try, but ignore any errors
            const loadOptionalSuffixOrder = ['type', 'operator_class'];
            initSqlFolders.map((initSqlFolder) => {
                // iterate all suffixes
                for (const suffix of [...loadSuffixOrder, ...loadOptionalSuffixOrder]) {
                    const paths = fastGlob.sync(`${initSqlFolder}/*.${suffix}.sql`, {
                        deep: true,
                        onlyFiles: true,
                    });
                    // load content
                    for (const filePath of paths) {
                        loadFilesOrder[suffix] = loadFilesOrder[suffix] || [];
                        const filePathStr = filePath.toString();
                        loadFilesOrder[suffix][filePathStr] = fs.readFileSync(filePathStr, 'utf8');
                    }
                }
            });
            // only if there are migration folders left
            if (Object.keys(loadFilesOrder).length > 0) {
                // run migration sql - mandatory
                try {
                    // create transaction
                    this.logger.trace('migration.db.init.mandatory.begin');
                    yield dbClient.query('BEGIN');
                    for (const suffix of loadSuffixOrder) {
                        if (loadFilesOrder[suffix] != null) {
                            for (const entry of Object.entries(loadFilesOrder[suffix])) {
                                const path = entry[0];
                                const statement = entry[1].toString();
                                try {
                                    this.logger.trace('migration.db.init.mandatory.file', path);
                                    yield dbClient.query(statement, null);
                                }
                                catch (err) {
                                    // error -> rollback
                                    this.logger.trace('migration.db.init.mandatory.error', suffix, path, err);
                                    throw err;
                                }
                            }
                        }
                    }
                    // commit
                    this.logger.trace('migration.db.init.mandatory.commit');
                    yield dbClient.query('COMMIT');
                }
                catch (err) {
                    // rollback
                    this.logger.trace('migration.db.init.mandatory.rollback', err);
                    yield dbClient.query('ROLLBACK');
                    throw err;
                }
                // run migration sql - optional (no transaction, just ignore if one fails)
                for (const suffix of loadOptionalSuffixOrder) {
                    if (loadFilesOrder[suffix] != null) {
                        for (const entry of Object.entries(loadFilesOrder[suffix])) {
                            const path = entry[0];
                            const statement = entry[1].toString();
                            try {
                                this.logger.trace('migration.db.init.optional.file', path);
                                yield dbClient.query(statement, null);
                            }
                            catch (err) {
                                // error -> rollback
                                this.logger.warn('migration.db.init.optional.failed', suffix, path);
                            }
                        }
                    }
                }
            }
        });
    }
    // create migration SQL statements out of two dbMeta objects (pg and GQL)
    getMigrationSqlStatements(fromDbMeta, toDbMeta, renameInsteadOfDrop = true) {
        // check if toDbMeta is empty -> Parsing error
        if (toDbMeta == null || Object.keys(toDbMeta).length === 0) {
            throw new Error(`Migration Error: Provided migration final state is empty.`);
        }
        // crete copy of objects
        // new
        this.fromDbMeta = _.cloneDeep(fromDbMeta);
        // remove views and exposed names
        delete fromDbMeta.exposedNames;
        // old
        this.toDbMeta = _.cloneDeep(toDbMeta);
        // remove views and exposed names
        delete toDbMeta.exposedNames;
        // create migration object with actions based on two DbMeta objects
        this.migrationObject = migrationObject_1.migrationObject.createFromTwoDbMetaObjects(this.fromDbMeta, this.toDbMeta);
        // return SQL statements
        return createSqlObjFromMigrationObject_1.sqlObjFromMigrationObject.getSqlFromMigrationObj(this.migrationObject, this.toDbMeta, renameInsteadOfDrop);
    }
    getViewsSql() {
        this.schemaBuilderConfig = this.config.getConfig('schemaBuilder');
        return createViewsFromDbMeta_1.default(this.toDbMeta, this.dbConfig.general.database, this.dbConfig.general.user, this.schemaBuilderConfig.setUserPrivileges);
    }
    getBootSql() {
        const bootSql = [];
        const paths = fastGlob.sync(`${__dirname}/boot_scripts/*.sql`, {
            deep: true,
            onlyFiles: true,
        });
        // load content
        for (const filePath of paths) {
            const filePathStr = filePath.toString();
            bootSql.push(fs.readFileSync(filePathStr, 'utf8'));
        }
        return bootSql;
    }
    migrate(fromDbMeta, toDbMeta, renameInsteadOfDrop = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // get DB pgClient from DI container
            const dbClient = this.dbAppClient.pgClient;
            // init DB
            yield this.initDb();
            // get migration statements
            const migrationSqlStatements = this.getMigrationSqlStatements(fromDbMeta, toDbMeta, renameInsteadOfDrop);
            // get previous migration and compare to current
            const previousMigrationRow = (yield dbClient.query(`SELECT state FROM _meta.migrations ORDER BY created_at DESC LIMIT 1;`)).rows[0];
            const previousMigrationStateJSON = (previousMigrationRow == null) ? {} : previousMigrationRow.state;
            // Migrate if any statements where generated (e.g. DB was changed but not DBMeta) OR any changes occurred to DBMeta
            if (migrationSqlStatements.length > 0 || deep_diff_1.diff(previousMigrationStateJSON, toDbMeta) != null) {
                // get view statements
                const viewsSqlStatements = this.getViewsSql();
                // run DB migrations
                try {
                    // create transaction
                    this.logger.trace('migration.begin');
                    yield dbClient.query('BEGIN');
                    // run migration sql
                    for (const sql of Object.values(migrationSqlStatements)) {
                        this.logger.trace('migration.sql.statement', sql);
                        yield dbClient.query(sql);
                    }
                    // create views based on DB
                    for (const sql of Object.values(viewsSqlStatements)) {
                        this.logger.trace('migration.view.sql.statement', sql);
                        yield dbClient.query(sql);
                    }
                    // current framework db version
                    const dbVersion = (yield dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0].value;
                    // last step, save final dbMeta in _meta
                    this.logger.trace('migration.state.saved');
                    yield dbClient.query(`INSERT INTO "_meta"."migrations"(version, state) VALUES($1,$2)`, [dbVersion, toDbMeta]);
                    // commit
                    this.logger.trace('migration.commit');
                    yield dbClient.query('COMMIT');
                }
                catch (err) {
                    // rollback
                    this.logger.warn('migration.rollback');
                    yield dbClient.query('ROLLBACK');
                    throw err;
                }
            }
            // run boot sql script every time - independent, no transaction
            const bootSqlStatements = this.getBootSql();
            for (const sql of Object.values(bootSqlStatements)) {
                this.logger.trace('migration.boot.sql.statement', sql);
                yield dbClient.query(sql);
            }
        });
    }
    // boot and load all extensions
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            // load all extensions
            require('./extensions');
        });
    }
};
DbSchemaBuilder = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(1, di_1.Inject(type => config_1.Config)),
    __param(2, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(3, di_1.Inject(type => db_1.DbAppClient)),
    __metadata("design:paramtypes", [Object, config_1.Config,
        logger_1.LoggerFactory,
        db_1.DbAppClient])
], DbSchemaBuilder);
exports.DbSchemaBuilder = DbSchemaBuilder;
