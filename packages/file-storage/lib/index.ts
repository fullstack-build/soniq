import * as fs from "fs";
import * as Minio from "minio";
import { Auth } from "@fullstack-one/auth";
import { BootLoader } from "@fullstack-one/boot-loader";
import { Config } from "@fullstack-one/config";
import { ORM } from "@fullstack-one/db";
import { Service, Inject } from "@fullstack-one/di";
import { GraphQl, UserInputError, AuthenticationError } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { DefaultVerifier } from "./DefaultVerifier";
import { insertFileColumnsAndCreateTrigger } from "./fileColumnsAndTrigger";
import { FileName, IInput } from "./FileName";
import IFileStorageConfig from "./IFileStorageConfig";
import migrations from "./migrations";
import { getParser } from "./parser";
import { AVerifier, IBucketObject, IPutObjectCacheSettings, IGetObjectCacheSettings, IVerifier } from "./Verifier";
import { IUploadFile, IBucketFile } from "./interfaces";

export { DefaultVerifier, AVerifier, Minio, IBucketObject, IPutObjectCacheSettings, IGetObjectCacheSettings, FileName };
export * from "./decorators";

const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

@Service()
export class FileStorage {
  private client: Minio.Client;
  private fileStorageConfig: IFileStorageConfig;
  private logger: ILogger;
  private verifierClasses: { [type: string]: new (client: Minio.Client, bucket: string) => any } = {};
  private verifierObjects: { [type: string]: IVerifier } = {};

  constructor(
    @Inject((type) => Auth) private readonly auth: Auth,
    @Inject((type) => GraphQl) private readonly graphQl: GraphQl,
    @Inject((type) => SchemaBuilder) private readonly schemaBuilder: SchemaBuilder,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => Config) config: Config,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => ORM) private readonly orm: ORM
  ) {
    this.fileStorageConfig = config.registerConfig("FileStorage", `${__dirname}/../config`);

    this.logger = loggerFactory.create(this.constructor.name);

    this.orm.addMigrations(migrations);

    this.schemaBuilder.extendSchema(schema);
    this.schemaBuilder.addExtension(getParser());

    this.graphQl.addResolvers(this.getResolvers());
    // TODO: Should be made available somehow
    // this.graphQl.addPostMutationHook(this.postMutationHook.bind(this));

    this.addVerifier("DEFAULT", DefaultVerifier);
    this.client = new Minio.Client(this.fileStorageConfig.minio);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    try {
      Object.keys(this.verifierClasses).forEach((key) => {
        // tslint:disable-next-line:variable-name
        const CurrentVerifier = this.verifierClasses[key];
        this.verifierObjects[key] = new CurrentVerifier(this.client, this.fileStorageConfig.bucket);
      });
      await insertFileColumnsAndCreateTrigger(this.orm, this.logger);
      // createFileTrigger();
      // Create a presignedGetUrl for a not existing object to force minio to initialize itself. (Internally, it loads the bucket region)
      // This prevents errors, when large queries require a lot of signed URL's for the first time after boot.
      await this.client.presignedGetObject(this.fileStorageConfig.bucket, "notExistingObject.nothing", 1);
    } catch (err) {
      // log error and ignore
      this.logger.warn(err);
    }
  }

  private async postMutationHook(info, context) {
    try {
      const entityId = info.entityId;
      const result = await this.auth.getAuthQueryHelper().adminQuery("SELECT * FROM _meta.file_todelete_by_entity($1);", [entityId]);
      result.forEach((row) => {
        const fileName = new FileName(row);
        this.deleteFileAsAdmin(fileName);
      });
    } catch (e) {
      // I don't care
    }
  }

  private async presignedPutObject(objectName, cacheSettings: IPutObjectCacheSettings) {
    return this.client.presignedPutObject(this.fileStorageConfig.bucket, objectName, cacheSettings.expiryInSeconds);
  }

  private async presignedGetObject(objectName, cacheSettings: IGetObjectCacheSettings) {
    const respHeaders = {};

    if (cacheSettings.cacheControlHeader != null) {
      respHeaders["response-cache-control"] = cacheSettings.cacheControlHeader;
    }
    if (cacheSettings.expiryHeader != null) {
      respHeaders["response-expires"] = cacheSettings.expiryHeader;
    }

    const now = Date.now();
    const issueAtDate = new Date(now - (now % (cacheSettings.signIssueTimeReductionModuloInSeconds * 1000)));
    // @types/minio@7.0.2 does not support respHeaders and issueAtDate
    return (this.client as any).presignedGetObject(
      this.fileStorageConfig.bucket,
      objectName,
      cacheSettings.expiryInSeconds,
      respHeaders,
      issueAtDate
    );
  }

  private async deleteFileAsAdmin(fileName: FileName) {
    try {
      await this.auth.getAuthQueryHelper().adminTransaction(async (client) => {
        const result = await client.query("SELECT * FROM _meta.file_deleteone_admin($1);", [fileName.id]);
        if (result.length < 1) {
          throw new Error("Failed to delete file 'fileId' from db.");
        }
        await this.deleteObjects(fileName.prefix);
      });
    } catch (e) {
      this.logger.warn("deleteFileAsAdmin.error", `Failed to delete file '${fileName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private async deleteFile(fileName: FileName, context: { accessToken?: string }) {
    try {
      await this.auth.getAuthQueryHelper().userTransaction(context.accessToken, async (client) => {
        await client.query("SELECT * FROM _meta.file_deleteone($1);", [fileName.id]);
        await this.deleteObjects(fileName.prefix);
      });
    } catch (e) {
      this.logger.warn("deleteFile.error", `Failed to delete file '${fileName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private deleteObjects(filePrefix: string) {
    return new Promise((resolve, reject) => {
      const objectsList = [];

      const objectsStream = this.client.listObjects(this.fileStorageConfig.bucket, filePrefix, true);

      objectsStream.on("data", (obj) => {
        objectsList.push(obj.name);
      });

      objectsStream.on("error", (err) => {
        reject(err);
      });

      objectsStream.on("end", async () => {
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
      "@fullstack-one/file-storage/createFile": async (
        obj: any,
        args: { extension: string; type?: string },
        context: { accessToken?: string },
        info: any,
        params: {}
      ) => {
        if (context.accessToken == null) {
          throw new AuthenticationError("Authentication required for create file.");
        }

        return this.createFile(args.extension, args.type, context.accessToken);
      },
      "@fullstack-one/file-storage/verifyFile": async (
        obj: any,
        args: { fileName: string },
        context: { accessToken?: string },
        info: any,
        params: {}
      ) => {
        if (context.accessToken == null) {
          throw new AuthenticationError("Authentication required for verify file.");
        }
        return this.verifyFile(args.fileName, context.accessToken);
      },
      "@fullstack-one/file-storage/clearUpFiles": async (
        obj: any,
        args: { fileName?: string },
        context: { accessToken?: string },
        info: any,
        params: {}
      ) => {
        let result: IInput[] = [];

        if (args.fileName != null) {
          const fileName = new FileName(args.fileName);
          result = await this.auth.getAuthQueryHelper().userQuery(context.accessToken, "SELECT * FROM _meta.file_clearupone($1);", [fileName.id]);
        } else {
          result = await this.auth.getAuthQueryHelper().userQuery(context.accessToken, "SELECT * FROM _meta.file_clearup();");
        }

        const filesDeleted = result.map((row) => new FileName(row));

        filesDeleted.forEach((fileName) => {
          this.deleteFile(fileName, context);
        });

        return filesDeleted.map((fileName) => fileName.name);
      },
      "@fullstack-one/file-storage/readFiles": async (
        obj: { [fieldName: string]: Array<string | IInput> },
        args: {},
        context: {},
        info,
        params: {}
      ) => {
        if (obj[info.fieldName] == null) {
          return [];
        }

        const fileNames: any = obj[info.fieldName];

        return this.readFiles(fileNames);
      }
    };
  }

  public addVerifier(type: string, fn: new (client: Minio.Client, bucket: string) => any) {
    const regex = "^[_a-zA-Z][_a-zA-Z0-9]{3,30}$";
    const regexp = new RegExp(regex);
    if (regexp.test(type) !== true) {
      throw new UserInputError(`The type '${type}' has to match RegExp '${regex}'.`, { exposeDetails: true });
    }
    if (this.verifierClasses[type] == null) {
      this.verifierClasses[type] = fn;
    } else {
      throw new UserInputError(`A verifier for type '${type}' already exists.`, { exposeDetails: true });
    }
  }

  public async createFile(extension: string, type?: string | null, accessToken?: string | null): Promise<IUploadFile> {
    const extensionInternal = extension.toLowerCase();
    const typeInternal = type || "DEFAULT";

    if (this.verifierObjects[typeInternal] == null) {
      throw new UserInputError(`A verifier for type '${typeInternal}' hasn't been defined.`, { exposeDetails: true });
    }

    const authQueryHelper = this.auth.getAuthQueryHelper();
    let result: any;

    // tslint:disable-next-line:prefer-conditional-expression
    if (accessToken != null) {
      result = await authQueryHelper.userQuery(accessToken, 'SELECT _meta.file_create($1, $2) AS "fileId";', [extensionInternal, typeInternal]);
    } else {
      result = await authQueryHelper.adminQuery('SELECT _meta.file_create_system($1, $2) AS "fileId";', [extensionInternal, typeInternal]);
    }

    const fileName = new FileName({
      id: result[0].fileId,
      type: typeInternal,
      extension: extensionInternal
    });

    const cacheSettings = this.verifierObjects[typeInternal].putObjectCacheSettings();

    const presignedPutUrl = await this.presignedPutObject(fileName.uploadName, cacheSettings);

    return {
      extension: extensionInternal,
      type: typeInternal,
      fileName: fileName.name,
      uploadFileName: fileName.uploadName,
      presignedPutUrl
    };
  }

  public async verifyFile(fileNameString: string, accessToken?: string | null): Promise<IBucketFile> {
    const fileName = new FileName(fileNameString);

    const authQueryHelper = this.auth.getAuthQueryHelper();
    let result: any;

    // tslint:disable-next-line:prefer-conditional-expression
    if (accessToken != null) {
      result = await authQueryHelper.userQuery(accessToken, 'SELECT _meta.file_get_type_to_verify($1) AS "type";', [fileName.id]);
    } else {
      result = await authQueryHelper.query('SELECT _meta.file_get_type_to_verify($1) AS "type";', [fileName.id]);
    }

    const type = result[0].type;
    let stat = null;

    if (this.verifierObjects[type] == null) {
      throw new UserInputError(`A verifier for type '${type}' hasn't been defined.`, { exposeDetails: true });
    }

    if (type !== fileName.type) {
      throw new UserInputError(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`, { exposeDetails: true });
    }

    try {
      stat = await this.client.statObject(this.fileStorageConfig.bucket, fileName.uploadName);
    } catch (e) {
      if (e.message.toLowerCase().indexOf("not found") >= 0) {
        throw new UserInputError("Please upload a file before verifying.", { exposeDetails: true });
      }
      throw e;
    }

    const verifyFileName = fileName.createTempName();

    const verifyCopyConditions = new Minio.CopyConditions();
    verifyCopyConditions.setMatchETag(stat.etag);

    await this.client.copyObject(
      this.fileStorageConfig.bucket,
      verifyFileName,
      `/${this.fileStorageConfig.bucket}/${fileName.uploadName}`,
      verifyCopyConditions
    );

    await this.verifierObjects[type].verify(verifyFileName, fileName);

    if (accessToken != null) {
      await this.auth.getAuthQueryHelper().userQuery(accessToken, "SELECT _meta.file_verify($1);", [fileName.id]);
    } else {
      await this.auth.getAuthQueryHelper().query("SELECT _meta.file_verify($1);", [fileName.id]);
    }

    // Try to clean up temp objects. However, don't care if it fails.
    try {
      await this.client.removeObjects(this.fileStorageConfig.bucket, [fileName.uploadName, verifyFileName]);
    } catch (err) {
      this.logger.warn("verifyFile.removeObjectsFail", err);
    }

    const verifier = this.verifierObjects[fileName.type];

    const objectNames = verifier.getObjectNames(fileName);

    const cacheSettings = verifier.getObjectCacheSettings(fileName);

    const objects = objectNames.map((object) => {
      return {
        objectName: object.objectName,
        info: object.info,
        presignedGetUrlPromise: this.presignedGetObject(object.objectName, cacheSettings)
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
        this.logger.warn("readFiles.signFail.promise", err);
      }
    }

    return {
      fileName: fileName.name,
      objects: bucketObjects
    };
  }

  public async readFiles(fileNames: string[]): Promise<IBucketFile[]> {
    const awaitingFileSignatures = [];

    for (const fileName of fileNames) {
      try {
        const fName = new FileName(fileName);

        const verifier = this.verifierObjects[fName.type];

        const objectNames = verifier.getObjectNames(fName);

        const cacheSettings = verifier.getObjectCacheSettings(fName);

        const objects = objectNames.map((object) => {
          return {
            objectName: object.objectName,
            presignedGetUrlPromise: this.presignedGetObject(object.objectName, cacheSettings),
            info: object.info
          };
        });

        awaitingFileSignatures.push({
          fileName,
          objects
        });
      } catch (err) {
        // Errors can be ignored => Failed Signs are not returned
        this.logger.warn("readFiles.signFail", err);
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
            this.logger.warn("readFiles.signFail.promise", err);
          }
        }

        results.push({
          fileName,
          objects
        });
      } catch (err) {
        // Errors can be ignored => Failed Signs are not returned
        this.logger.warn("readFiles.signFail.promise", err);
      }
    }

    return results;
  }
}
