import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { Migration } from '@fullstack-one/migration';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { GraphQlParser } from '@fullstack-one/graphql-parser';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as Minio from 'minio';
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';

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

  constructor(
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Server) server?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => Migration) migration?,
    @Inject(type => Config) config?,
    @Inject(type => GraphQl) graphQl?,
    @Inject(type => GraphQlParser) graphQlParser?
  ) {
    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.server = server;
    this.dbGeneralPool = dbGeneralPool;
    this.graphQl = graphQl;
    this.graphQlParser = graphQlParser;

    // add migration path
    migration.addMigrationPath(__dirname + '/..');

    this.fileStorageConfig = config.getConfig('fileStorage');

    this.client = new Minio.Client(this.fileStorageConfig.minio);

    this.graphQlParser.extendSchema(schema);

    this.graphQl.addResolvers(this.getResolvers());

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  private async boot() {
    const authRouter = new KoaRouter();

    const app = this.server.getApp();

    authRouter.get('/test', async (ctx) => {
      ctx.body = 'Hallo';
    });

    authRouter.use(koaBody());

    app.use(authRouter.routes());
    app.use(authRouter.allowedMethods());
  }

  private getResolvers() {
    return {
      '@fullstack-one/file-storage/createFile': async (obj, args, context, info, params) => {
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
