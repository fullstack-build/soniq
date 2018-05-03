import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { Migration } from '@fullstack-one/migration';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { Auth } from '@fullstack-one/auth';
import { GraphQlParser } from '@fullstack-one/graphql-parser';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as Minio from 'minio';
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';
import * as filesParser from './parser';

import * as fs from 'fs';

const schema = fs.readFileSync(require.resolve('./schema.gql'), 'utf-8');

@Service()
export class FileStorage {

  private client;
  private fileStorageConfig;

  // DI
  private dbGeneralPool: DbGeneralPool;
  private server: Server;
  private graphQl: GraphQl;
  private graphQlParser: GraphQlParser;
  private config: Config;
  private auth: Auth;

  constructor(
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Server) server?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => Migration) migration?,
    @Inject(type => Config) config?,
    @Inject(type => GraphQl) graphQl?,
    @Inject(type => GraphQlParser) graphQlParser?,
    @Inject(type => Auth) auth?
  ) {
    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.server = server;
    this.dbGeneralPool = dbGeneralPool;
    this.graphQl = graphQl;
    this.graphQlParser = graphQlParser;
    this.config = config;
    this.auth = auth;

    // add migration path
    migration.addMigrationPath(__dirname + '/..');

    this.graphQlParser.extendSchema(schema);

    this.graphQlParser.addParser(filesParser);

    this.graphQl.addResolvers(this.getResolvers());

    bootLoader.addBootFunction(this.boot.bind(this));
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

  private async presignedPutObject(fileName) {
    return await this.client.presignedPutObject(this.fileStorageConfig.bucket, fileName, 12 * 60 * 60);
  }

  private async presignedGetObject(fileName) {
    return await this.client.presignedGetObject(this.fileStorageConfig.bucket, fileName, 12 * 60 * 60);
  }

  private getResolvers() {
    return {
      '@fullstack-one/file-storage/createFile': async (obj, args, context, info, params) => {
        // console.log('**', args, context.accessToken);
        const extension = args.extension.toLowerCase();

        const result = await this.auth.userQuery(context.accessToken, `SELECT _meta.file_create($1) AS "fileId";`, [extension]);
        // console.log('--', result);
        const fileId = result.rows[0].fileId;
        const fileName = fileId + '.' + extension;

        const presignedPutUrl = await this.presignedPutObject(fileName);
        const presignedGetUrl = await this.presignedGetObject(fileName);

        return {
          extension,
          fileId,
          fileName,
          presignedPutUrl,
          presignedGetUrl
        };
      },
      '@fullstack-one/file-storage/readFiles': async (obj, args, context, info, params) => {
        const awaitingFileSignatures = [];

        for (const fileName of obj) {
          try {
            awaitingFileSignatures.push({
              fileName,
              presignedGetUrlPromise: this.presignedGetObject(fileName)
            });
          } catch (err) {
            // Errors can be ignored => Failed Signs are not returned
            // TODO: Log this.
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
            // TODO: Log this.
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
