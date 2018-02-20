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
const ONE = require("fullstack-one");
const migrationObject_1 = require("./migrationObject");
const createViewsFromDbMeta_1 = require("./createViewsFromDbMeta");
const createSqlObjFromMigrationObject_1 = require("./createSqlObjFromMigrationObject");
let Migration = class Migration {
    constructor(fromDbMeta, toDbMeta) {
        // create logger
        this.logger = ONE.Container.get(ONE.LoggerFactory).create('Migration');
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
        // remove graphql // todo graphql from config
        delete toDbMeta.schemas.graphql;
        // getSqlFromMigrationObj diff with actions
        this.migrationObject = migrationObject_1.migrationObject.createFromTwoDbMetaObjects(this.fromDbMeta, this.toDbMeta);
    }
    getMigrationDbMeta() {
        return _.cloneDeep(this.migrationObject);
    }
    initDb() {
        return __awaiter(this, void 0, void 0, function* () {
            // get DB pgClient from DI container
            const dbClient = ONE.Container.get(ONE.DbAppClient).pgClient;
            // check latest version migrated
            let latestVersion = 0;
            try {
                const dbInitVersion = (yield dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0];
                if (dbInitVersion != null && dbInitVersion.value != null) {
                    latestVersion = parseFloat(dbInitVersion.value);
                    this.logger.debug('migration.db.init.version.detected', latestVersion);
                }
            }
            catch (err) {
                this.logger.info('migration.db.init.not.found');
            }
            // find init scripts to ignore
            let initFoldersToIgnore = [];
            if (latestVersion > 0) {
                const initFolders = fastGlob.sync(`${__dirname}/init_scripts/[0-9].[0-9]`, {
                    deep: false,
                    onlyDirs: true,
                });
                initFoldersToIgnore = initFolders.reduce((result, path) => {
                    const pathVersion = parseFloat(path.split('/').pop());
                    if (pathVersion <= latestVersion) {
                        result.push(path + '/**');
                    }
                    return result;
                }, []);
            }
            const loadSuffixOrder = ['extension', 'schema', 'type', 'table', 'function', 'set', 'insert', 'select'];
            // will try, but ignore any errors
            const loadOptionalSuffixOrder = ['operator_class'];
            const loadFilesOrder = {};
            for (const suffix of [...loadSuffixOrder, ...loadOptionalSuffixOrder]) {
                const paths = fastGlob.sync(`${__dirname}/init_scripts/[0-9].[0-9]/*/*.${suffix}.sql`, {
                    ignore: initFoldersToIgnore,
                    deep: true,
                    onlyFiles: true,
                });
                // load content
                for (const filePath of paths) {
                    loadFilesOrder[suffix] = loadFilesOrder[suffix] || [];
                    loadFilesOrder[suffix][filePath] = fs.readFileSync(filePath, 'utf8');
                }
            }
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
    getMigrationSqlStatements(renameInsteadOfDrop = true) {
        return createSqlObjFromMigrationObject_1.sqlObjFromMigrationObject.getSqlFromMigrationObj(this.migrationObject, this.toDbMeta, renameInsteadOfDrop);
    }
    getViewsSql() {
        return createViewsFromDbMeta_1.default(this.toDbMeta, 'appuserhugo', false);
    }
    getBootSql() {
        const bootSql = [];
        const paths = fastGlob.sync(`${__dirname}/boot_scripts/*.sql`, {
            deep: true,
            onlyFiles: true,
        });
        // load content
        for (const filePath of paths) {
            bootSql.push(fs.readFileSync(filePath, 'utf8'));
        }
        return bootSql;
    }
    migrate(renameInsteadOfDrop = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // get DB pgClient from DI container
            const dbClient = ONE.Container.get(ONE.DbAppClient).pgClient;
            // init DB
            yield this.initDb();
            // get migration statements
            const migrationSqlStatements = this.getMigrationSqlStatements(renameInsteadOfDrop);
            // anything to migrate?
            if (migrationSqlStatements.length > 0) {
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
                    // last step, save final dbMeta in _meta
                    this.logger.trace('migration.state.saved');
                    yield dbClient.query(`INSERT INTO "_meta"."migrations"(state) VALUES($1)`, [this.toDbMeta]);
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
};
Migration = __decorate([
    ONE.Service(),
    __metadata("design:paramtypes", [Object, Object])
], Migration);
exports.Migration = Migration;
