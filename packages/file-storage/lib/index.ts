import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { Auth } from '@fullstack-one/auth';
import { SchemaBuilder } from '@fullstack-one/schema-builder';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as Minio from 'minio';
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
import { getParser } from './parser';
import { defaultVerifier } from './defaultVerifier';

import * as fs from 'fs';

// extend migrations
import './migrationExtension';

const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');

@Service()
export class FileStorage {

  private client;
  private fileStorageConfig;

  // DI
  private dbGeneralPool: DbGeneralPool;
  private server: Server;
  private graphQl: GraphQl;
  private schemaBuilder: SchemaBuilder;
  private logger: ILogger;
  private config: Config;
  private auth: Auth;
  private verifiers: any = {};

  constructor(
    @Inject(type => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Server) server?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => Config) config?,
    @Inject(type => GraphQl) graphQl?,
    @Inject(type => SchemaBuilder) schemaBuilder?,
    @Inject(type => Auth) auth?
  ) {
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

    this.schemaBuilder.addExtension(getParser());

    this.graphQl.addResolvers(this.getResolvers());

    this.graphQl.addHook('postMutation', this.postMutationHook.bind(this));

    this.addVerifier('DEFAULT', defaultVerifier);

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public addVerifier(type, fn) {
    if (this.verifiers[type] == null) {
      this.verifiers[type] = fn;
    } else {
      throw new Error(`A verifier for type '${type}' already exists.`);
    }
  }

  private async boot() {
    this.fileStorageConfig = this.config.getConfig('fileStorage');

    this.client = new Minio.Client(this.fileStorageConfig.minio);

    const authRouter = new KoaRouter();

    const app = this.server.getApp();

    authRouter.get('/test', async (ctx) => {
      ctx.body = 'Hallo';
    });

    authRouter.use(koaBody());

    app.use(authRouter.routes());
    app.use(authRouter.allowedMethods());
  }

  private async postMutationHook(info, context) {
    try {
      const entityId = info.entityId;
      const result = await this.auth.adminQuery('SELECT * FROM _meta.file_todelete_by_entity($1);', [entityId]);
      result.rows.forEach((row) => {
        this.deleteFileAsAdmin(`${row.id}.${row.extension}`);
      });
    } catch (e) {
      // I don't care
    }
  }

  private async presignedPutObject(fileName) {
    return await this.client.presignedPutObject(this.fileStorageConfig.bucket, fileName, 12 * 60 * 60);
  }

  private async presignedGetObject(fileName) {
    return await this.client.presignedGetObject(this.fileStorageConfig.bucket, fileName, 12 * 60 * 60);
  }

  private async deleteFileAsAdmin(fileName) {
    let fileInBucket = false;
    try {
      const stats = await this.client.statObject(this.fileStorageConfig.bucket, fileName);
      fileInBucket = true;
    } catch (e) {
      // The file has never been created.
    }
    try {
      await this.auth.adminTransaction(async (client) => {
        const fileId = fileName.split('.')[0];
        const result = await client.query('SELECT * FROM _meta.file_deleteone_admin($1);', [fileId]);
        if (result.rows.length < 1) {
          throw new Error("Failed to delete file 'fileId' from db.");
        }
        if (fileInBucket === true) {
          await this.client.removeObject(this.fileStorageConfig.bucket, fileName);
        }
      });
    } catch (e) {
      this.logger.warn('deleteFileAsAdmin.error', `Failed to delete file '${fileName}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private async deleteFile(fileName, context) {
    let fileInBucket = false;
    try {
      const stats = await this.client.statObject(this.fileStorageConfig.bucket, fileName);
      fileInBucket = true;
    } catch (e) {
      // The file has never been created.
    }
    try {
      await this.auth.userTransaction(context.accessToken, async (client) => {
        const fileId = fileName.split('.')[0];
        await client.query('SELECT * FROM _meta.file_deleteone($1);', [fileId]);
        if (fileInBucket === true) {
          await this.client.removeObject(this.fileStorageConfig.bucket, fileName);
        }
      });
    } catch (e) {
      this.logger.warn('deleteFile.error', `Failed to delete file '${fileName}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private getResolvers() {
    return {
      '@fullstack-one/file-storage/createFile': async (obj, args, context, info, params) => {
        const extension = args.extension.toLowerCase();
        const type = args.type || 'DEFAULT';

        if (this.verifiers[type] == null) {
          throw new Error(`A verifier for type '${type}' hasn't been defined.`);
        }

        const result = await this.auth.userQuery(context.accessToken, 'SELECT _meta.file_create($1, $2) AS "fileId";', [extension, type]);
        const fileId = result.rows[0].fileId;
        const fileName = fileId + '.' + extension;

        const presignedPutUrl = await this.presignedPutObject(fileName);

        return {
          extension,
          type,
          fileName,
          presignedPutUrl
        };
      },
      '@fullstack-one/file-storage/verifyFile': async (obj, args, context, info, params) => {
        const fileName = args.fileName;
        const fileId = fileName.split('.')[0];

        const result = await this.auth.userQuery(context.accessToken, 'SELECT _meta.file_get_type_to_verify($1) AS "type";', [fileId]);
        const type = result.rows[0].type;

        if (this.verifiers[type] == null) {
          throw new Error(`A verifier for type '${type}' hasn't been defined.`);
        }

        const ctx = {
          client: this.client,
          fileName,
          bucket: this.fileStorageConfig.bucket
        };

        await this.verifiers[type](ctx);

        await this.auth.userQuery(context.accessToken, 'SELECT _meta.file_verify($1);', [fileId]);

        const presignedGetUrl = await this.presignedGetObject(fileName);

        return {
          fileName,
          presignedGetUrl
        };
      },
      '@fullstack-one/file-storage/clearUpFiles': async (obj, args, context, info, params) => {
        let result;

        if (args.fileName != null) {
          const fileId = args.fileName.split('.')[0];
          result = await this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearupone($1);', [fileId]);
        } else {
          result = await this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearup();');
        }

        const filesDeleted = result.rows.map(row => `${row.id}.${row.extension}`);

        filesDeleted.forEach((fileName) => {
          this.deleteFile(fileName, context);
        });

        return filesDeleted;
      },
      '@fullstack-one/file-storage/readFiles': async (obj, args, context, info, params) => {
        const awaitingFileSignatures = [];

        if (obj[info.fieldName] == null) {
          return [];
        }

        const data = obj[info.fieldName];

        for (const fileName of data) {
          try {
            awaitingFileSignatures.push({
              fileName,
              presignedGetUrlPromise: this.presignedGetObject(fileName)
            });
          } catch (err) {
            // Errors can be ignored => Failed Signs are not returned
            this.logger.warn('readFiles.signFail', err);
          }
        }

        const results = [];

        for (const fileObject of awaitingFileSignatures) {
          try {
            const presignedGetUrl = await fileObject.presignedGetUrlPromise;
            const fileName = fileObject.fileName;
            results.push({
              fileName,
              presignedGetUrl
            });
          } catch (err) {
            // Errors can be ignored => Failed Signs are not returned
            this.logger.warn('readFiles.signFail.promise', err);
          }
        }

        return results;
      }
    };
  }
}

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
