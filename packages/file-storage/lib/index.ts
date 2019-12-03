import * as fs from "fs";
import * as Minio from "minio";
import { Auth } from "@fullstack-one/auth";
// import { BootLoader } from "@fullstack-one/boot-loader";
import { Config } from "@fullstack-one/config";
import { Core, IModuleAppConfig, IModuleEnvConfig, PoolClient, IModuleMigrationResult, TGetModuleRuntimeConfig, Pool } from "@fullstack-one/core";
import { Service, Inject } from "@fullstack-one/di";
import { GraphQl, UserInputError, AuthenticationError, ReturnIdHandler, ICustomResolverObject } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
// import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { DefaultVerifier } from "./DefaultVerifier";
import { FileName, IInput } from "./FileName";
import IFileStorageConfig from "./IFileStorageConfig";
import { AVerifier, IBucketObject, IPutObjectCacheSettings, IGetObjectCacheSettings, IVerifier } from "./Verifier";
import { IUploadFile, IBucketFile } from "./interfaces";
import { migrate } from "./migration";
import { columnExtensionFile } from "./migration/fileColumnExtension";
import { postProcessingExtensionFile } from "./migration/filePostProcessingExtension";

export { DefaultVerifier, AVerifier, Minio, IBucketObject, IPutObjectCacheSettings, IGetObjectCacheSettings, FileName };
export * from "./interfaces";

const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

@Service()
export class FileStorage {
  private client: Minio.Client;
  private clientInitialising: boolean = false;
  private clientInitialised: boolean = false;
  private runtimeConfig: IFileStorageConfig;
  private logger: ILogger;
  private verifierClasses: { [type: string]: new (client: Minio.Client, bucket: string) => any } = {};
  private verifierObjects: { [type: string]: IVerifier } = {};
  private getRuntimeConfig: TGetModuleRuntimeConfig;
  private pgPool: Pool;
  private clientInitPromiseResolver: ((value?: any) => void)[] = [];

  constructor(
    @Inject((type) => Auth) private readonly auth: Auth,
    @Inject((type) => GraphQl) private readonly graphQl: GraphQl,
    // @Inject((type) => SchemaBuilder) private readonly schemaBuilder: SchemaBuilder,
    // @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => Config) config: Config,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Core) private readonly core: Core
  ) {
    // this.runtimeConfig = config.registerConfig("FileStorage", `${__dirname}/../config`);

    this.logger = loggerFactory.create(this.constructor.name);

    // this.orm.addMigrations(migrations);

    // this.schemaBuilder.extendSchema(schema);
    // this.schemaBuilder.addExtension(getParser());

    // this.graphQl.addResolvers(this.getResolvers());
    // TODO: Should be made available somehow
    // this.graphQl.addPostMutationHook(this.postMutationHook.bind(this));

    this.addVerifier("DEFAULT", DefaultVerifier);

    this.core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this.migrate.bind(this),
      boot: this.boot.bind(this)
    });
    graphQl.addTypeDefsExtension(() => {
      const fileTypes = Object.keys(this.verifierClasses);

      const fileTypesEnum = this.generateGqlEnumType({name: "FILE_TYPES", options: fileTypes});

      console.log('>>', `${fileTypesEnum}\n${schema}`);

      return `${fileTypesEnum}\n${schema}`;
    });

    graphQl.addResolvers(this.getResolvers());

    Object.keys(this.getResolvers())
      .filter((key) => {
        return key.split("/").length > 3;
      })
      .map((key) => {
        const splittedKey = key.split("/");

        return () => {
          return {
            path: `${splittedKey[2]}.${splittedKey[3]}`,
            key,
            config: {}
          };
        };
      })
      .forEach(graphQl.addResolverExtension.bind(graphQl));

    graphQl.addColumnExtension(columnExtensionFile);
    graphQl.addPostProcessingExtension(postProcessingExtensionFile);
  }

  private async migrate(appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    return migrate(this.graphQl, appConfig, envConfig, pgClient);
  }

  private async boot(getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool) {
    this.getRuntimeConfig = getRuntimeConfig;
    this.pgPool = pgPool;

    const { runtimeConfig } = await getRuntimeConfig();

    this.runtimeConfig = runtimeConfig;
    this.updateRuntimeConfig(runtimeConfig);
  }

  private updateRuntimeConfig (runtimeConfig: any) {
    this.client = new Minio.Client(runtimeConfig.minio);
    this.clientInitialised = false;

    Object.keys(this.verifierClasses).forEach((key) => {
      // tslint:disable-next-line:variable-name
      const CurrentVerifier = this.verifierClasses[key];
      this.verifierObjects[key] = new CurrentVerifier(this.client, runtimeConfig.bucket);
    });
  }

  private async postMutationHook(info, context) {
    try {
      const entityId = info.entityId;
      const result = await this.auth.getAuthQueryHelper().adminQuery("SELECT * FROM _file_storage.file_todelete_by_entity($1);", [entityId]);
      result.rows.forEach((row) => {
        const fileName = new FileName(row);
        this.deleteFileAsAdmin(fileName);
      });
    } catch (e) {
      // I don't care
    }
  }

  private async ensureInitializedClient() {
    const { runtimeConfig, hasBeenUpdated } = await this.getRuntimeConfig();

    this.runtimeConfig = runtimeConfig;
    if (hasBeenUpdated) {
      this.updateRuntimeConfig(runtimeConfig);
    }

    if (this.clientInitialised) {
      return true;
    } else {
      if (this.clientInitialising !== true) {
        setTimeout(async () => {
          if (this.clientInitialising !== true) {
            this.clientInitialising = true;
            try {
              // Create a presignedGetUrl for a not existing object to force minio to initialize itself. (Internally, it loads the bucket region)
              // This prevents errors, when large queries require a lot of signed URL's for the first time after boot.
              await this.client.presignedGetObject(this.runtimeConfig.bucket, "notExistingObject.nothing", 1);

              for (const resolverFunction of this.clientInitPromiseResolver) {
                try {
                  resolverFunction();
                } catch (err) {
                  // Ignore Errors because this is only an Event
                }
              }
            } catch (err) {
              // log error and ignore
              this.logger.warn(err);
            } finally {
              this.clientInitialising = false;
            }
          }
        }, 10);
      }

      return new Promise((resolve) => {
        this.clientInitPromiseResolver.push(resolve);
      });
    }
  }

  private async presignedPutObject(objectName, cacheSettings: IPutObjectCacheSettings) {
    await this.ensureInitializedClient();

    return this.client.presignedPutObject(this.runtimeConfig.bucket, objectName, cacheSettings.expiryInSeconds);
  }

  private async presignedGetObject(objectName, cacheSettings: IGetObjectCacheSettings) {
    await this.ensureInitializedClient();
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
      this.runtimeConfig.bucket,
      objectName,
      cacheSettings.expiryInSeconds,
      respHeaders,
      issueAtDate
    );
  }

  private async deleteFileAsAdmin(fileName: FileName) {
    await this.ensureInitializedClient();
    try {
      await this.auth.getAuthQueryHelper().adminTransaction(async (client) => {
        const result = await client.query("SELECT * FROM _file_storage.file_deleteone_admin($1);", [fileName.id]);
        if (result.rowCount < 1) {
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
    await this.ensureInitializedClient();
    try {
      await this.auth.getAuthQueryHelper().userTransaction(context.accessToken, async (client) => {
        await client.query("SELECT * FROM _file_storage.file_deleteone($1);", [fileName.id]);
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

      const objectsStream = this.client.listObjects(this.runtimeConfig.bucket, filePrefix, true);

      objectsStream.on("data", (obj) => {
        objectsList.push(obj.name);
      });

      objectsStream.on("error", (err) => {
        reject(err);
      });

      objectsStream.on("end", async () => {
        try {
          await this.client.removeObjects(this.runtimeConfig.bucket, objectsList);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/file-storage/Mutation/createFile": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            if (context.accessToken == null) {
              throw new AuthenticationError("Authentication required for create file.");
            }

            return this.createFile(args.extension, args.type, context.accessToken);
          }
        }
      },
      "@fullstack-one/file-storage/Mutation/verifyFile": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            if (context.accessToken == null) {
              throw new AuthenticationError("Authentication required for verify file.");
            }
            return this.verifyFile(args.fileName, context.accessToken);
          }
        }
      },
      "@fullstack-one/file-storage/Mutation/clearUpFiles": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            let result: IInput[] = [];

            if (args.fileName != null) {
              const fileName = new FileName(args.fileName);
              result = (await this.auth.getAuthQueryHelper().userQuery(context.accessToken, "SELECT * FROM _file_storage.file_clearupone($1);", [fileName.id])).rows;
            } else {
              result = (await this.auth.getAuthQueryHelper().userQuery(context.accessToken, "SELECT * FROM _file_storage.file_clearup();")).rows;
            }

            const filesDeleted = result.map((row) => new FileName(row));

            filesDeleted.forEach((fileName) => {
              this.deleteFile(fileName, context);
            });

            return filesDeleted.map((fileName) => fileName.name);
          }
        }
      },
      "@fullstack-one/file-storage/readFiles":  (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            if (obj[info.fieldName] == null) {
              return [];
            }

            const fileNames: any = obj[info.fieldName];

            return this.readFiles(fileNames);
          }
        }
      }
    };
  }

  private generateGqlEnumType(type: { name: string; options: string[] }): string {
    let def = `enum ${type.name} {\n`;

    def += type.options
      .map((option) => {
        return `  ${option}\n`;
      })
      .join("");

    def += "}\n";

    return def;
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
      result = await authQueryHelper.userQuery(accessToken, 'SELECT _file_storage.file_create($1, $2) AS "fileId";', [extensionInternal, typeInternal]);
    } else {
      result = await authQueryHelper.adminQuery('SELECT _file_storage.file_create_system($1, $2) AS "fileId";', [extensionInternal, typeInternal]);
    }

    const fileName = new FileName({
      id: result.rows[0].fileId,
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
    await this.ensureInitializedClient();
    const fileName = new FileName(fileNameString);

    const authQueryHelper = this.auth.getAuthQueryHelper();
    let result: any;

    // tslint:disable-next-line:prefer-conditional-expression
    if (accessToken != null) {
      result = await authQueryHelper.userQuery(accessToken, 'SELECT _file_storage.file_get_type_to_verify($1) AS "type";', [fileName.id]);
    } else {
      result = await authQueryHelper.query('SELECT _file_storage.file_get_type_to_verify($1) AS "type";', [fileName.id]);
    }

    const type = result.rows[0].type;
    let stat = null;

    if (this.verifierObjects[type] == null) {
      throw new UserInputError(`A verifier for type '${type}' hasn't been defined.`, { exposeDetails: true });
    }

    if (type !== fileName.type) {
      throw new UserInputError(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`, { exposeDetails: true });
    }

    try {
      stat = await this.client.statObject(this.runtimeConfig.bucket, fileName.uploadName);
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
      this.runtimeConfig.bucket,
      verifyFileName,
      `/${this.runtimeConfig.bucket}/${fileName.uploadName}`,
      verifyCopyConditions
    );

    await this.verifierObjects[type].verify(verifyFileName, fileName);

    if (accessToken != null) {
      await this.auth.getAuthQueryHelper().userQuery(accessToken, "SELECT _file_storage.file_verify($1);", [fileName.id]);
    } else {
      await this.auth.getAuthQueryHelper().query("SELECT _file_storage.file_verify($1);", [fileName.id]);
    }

    // Try to clean up temp objects. However, don't care if it fails.
    try {
      await this.client.removeObjects(this.runtimeConfig.bucket, [fileName.uploadName, verifyFileName]);
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

  public getMinioClient(): Minio.Client {
    return this.client;
  }

  public getBucketName(): string {
    return this.runtimeConfig.bucket;
  }
}
