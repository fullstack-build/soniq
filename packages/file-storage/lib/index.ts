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
import { Verifier, IBucketObject } from './Verifier';
import { DefaultVerifier } from './DefaultVerifier';
import { FileName } from './FileName';

export { DefaultVerifier, Verifier, Minio, IBucketObject, FileName };

import * as fs from 'fs';

// extend migrations
import './migrationExtension';

const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');

@Service()
export class FileStorage {

  private client: Minio.Client;
  private fileStorageConfig;

  // DI
  private dbGeneralPool: DbGeneralPool;
  private server: Server;
  private graphQl: GraphQl;
  private schemaBuilder: SchemaBuilder;
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private config: Config;
  private auth: Auth;
  private verifiers: any = {};
  private verifierObjects: any = {};

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

    this.loggerFactory = loggerFactory;
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

    this.addVerifier('DEFAULT', DefaultVerifier);

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public addVerifier(type, fn) {
    const regex = '^[_a-zA-Z][_a-zA-Z0-9]{3,30}$';
    const regexp = new RegExp(regex);
    if (regexp.test(type) !== true) {
      throw new Error(`The type '${type}' has to match RegExp '${regex}'.`);
    }
    if (this.verifiers[type] == null) {
      this.verifiers[type] = fn;
    } else {
      throw new Error(`A verifier for type '${type}' already exists.`);
    }
  }

  private async boot() {
    this.logger = this.loggerFactory.create(this.constructor.name);

    this.fileStorageConfig = this.config.getConfig('fileStorage');

    this.client = new Minio.Client(this.fileStorageConfig.minio);

    Object.keys(this.verifiers).forEach((key) => {
      // tslint:disable-next-line:variable-name
      const CurrentVerifier = this.verifiers[key];
      this.verifierObjects[key] = new CurrentVerifier(this.client, this.fileStorageConfig.bucket);
    });

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
        const fileName = new FileName(row);
        this.deleteFileAsAdmin(fileName.name);
      });
    } catch (e) {
      // I don't care
    }
  }

  private async presignedPutObject(objectName) {
    return await this.client.presignedPutObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
  }

  private async presignedGetObject(objectName) {
    return await this.client.presignedGetObject(this.fileStorageConfig.bucket, objectName, 12 * 60 * 60);
  }

  private async deleteFileAsAdmin(fName) {
    try {
      await this.auth.adminTransaction(async (client) => {
        const result = await client.query('SELECT * FROM _meta.file_deleteone_admin($1);', [fName.id]);
        if (result.rows.length < 1) {
          throw new Error("Failed to delete file 'fileId' from db.");
        }
        await this.deleteObjects(fName.prefix);
      });
    } catch (e) {
      this.logger.warn('deleteFileAsAdmin.error', `Failed to delete file '${fName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private async deleteFile(fName, context) {
    try {
      await this.auth.userTransaction(context.accessToken, async (client) => {
        await client.query('SELECT * FROM _meta.file_deleteone($1);', [fName.id]);
        await this.deleteObjects(fName.prefix);
      });
    } catch (e) {
      this.logger.warn('deleteFile.error', `Failed to delete file '${fName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private deleteObjects(filePrefix) {
    return new Promise((resolve, reject) => {
      const objectsList = [];

      // List all object paths in bucket my-bucketname.
      // Cast this to any because minio returntype of listObjects is broken
      const objectsStream: any = this.client.listObjects(this.fileStorageConfig.bucket, filePrefix, true);

      objectsStream.on('data', (obj) => {
        objectsList.push(obj.name);
      });

      objectsStream.on('error', (err) => {
        reject(err);
      });

      objectsStream.on('end', async () => {
        try {
          await this.client.removeObjects(this.fileStorageConfig.bucket, objectsList);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
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

        const fName = new FileName({
          id: result.rows[0].fileId,
          type,
          extension
        });

        const presignedPutUrl = await this.presignedPutObject(fName.uploadName);

        return {
          extension,
          type,
          fileName: fName.name,
          uploadFileName: fName.uploadName,
          presignedPutUrl
        };
      },
      '@fullstack-one/file-storage/verifyFile': async (obj, args, context, info, params) => {
        const fName = new FileName(args.fileName);

        const result = await this.auth.userQuery(context.accessToken, 'SELECT _meta.file_get_type_to_verify($1) AS "type";', [fName.id]);
        const type = result.rows[0].type;
        let stat = null;

        if (this.verifierObjects[type] == null) {
          throw new Error(`A verifier for type '${type}' hasn't been defined.`);
        }

        if (type !== fName.type) {
          throw new Error(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`);
        }

        try {
          stat = await this.client.statObject(this.fileStorageConfig.bucket, fName.uploadName);
        } catch (e) {
          if (e.message.toLowerCase().indexOf('not found') >= 0) {
            throw new Error('Please upload a file before verifying.');
          }
          throw e;
        }

        const verifyFileName = fName.createTempName();

        const verifyCopyConditions = new Minio.CopyConditions();
        verifyCopyConditions.setMatchETag(stat.etag);

        await this.client.copyObject(this.fileStorageConfig.bucket, verifyFileName,
        `/${this.fileStorageConfig.bucket}/${fName.uploadName}`, verifyCopyConditions);

        await this.verifierObjects[type].verify(verifyFileName, fName);

        await this.auth.userQuery(context.accessToken, 'SELECT _meta.file_verify($1);', [fName.id]);

        // Try to clean up temp objects. However, don't care if it fails.
        try {
          await this.client.removeObjects(this.fileStorageConfig.bucket, [fName.uploadName, verifyFileName]);
        } catch (err) {
          this.logger.warn('verifyFile.removeObjectsFail', err);
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
              presignedGetUrl: await object.presignedGetUrlPromise
            });
          } catch (err) {
            this.logger.warn('readFiles.signFail.promise', err);
          }
        }

        return {
          fileName: fName.name,
          objects: bucketObjects
        };
      },
      '@fullstack-one/file-storage/clearUpFiles': async (obj, args, context, info, params) => {
        let result;

        if (args.fileName != null) {
          const fName = new FileName(args.fieldName);
          result = await this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearupone($1);', [fName.id]);
        } else {
          result = await this.auth.userQuery(context.accessToken, 'SELECT * FROM _meta.file_clearup();');
        }

        const filesDeleted = result.rows.map(row => new FileName(row));

        filesDeleted.forEach((fName) => {
          this.deleteFile(fName, context);
        });

        return filesDeleted.map(fName => fName.name);
      },
      '@fullstack-one/file-storage/readFiles': async (obj, args, context, info, params) => {
        const awaitingFileSignatures = [];

        if (obj[info.fieldName] == null) {
          return [];
        }

        const data = obj[info.fieldName];

        for (const fileName of data) {
          try {
            const fName = new FileName(fileName);

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
          } catch (err) {
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
            for (const object of fileObject.objects) {
              try {
                objects.push({
                  objectName: object.objectName,
                  info: object.info,
                  presignedGetUrl: await object.presignedGetUrlPromise
                });
              } catch (err) {
                this.logger.warn('readFiles.signFail.promise', err);
              }
            }

            results.push({
              fileName,
              objects
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
