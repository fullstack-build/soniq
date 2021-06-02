import * as fs from "fs";
import * as Minio from "minio";
import { Auth } from "@soniq/auth";
import { Core, PoolClient, IModuleMigrationResult, Pool, DI, Logger, QueryResult } from "soniq";
import { GraphQl, UserInputError, AuthenticationError, ReturnIdHandler } from "@soniq/graphql";
import { DefaultVerifier } from "./DefaultVerifier";
import { FileName, IInput } from "./FileName";
import { AVerifier, IPutObjectCacheSettings, IGetObjectCacheSettings, IVerifier } from "./Verifier";
import {
  IUploadFile,
  IBucketFile,
  IBucketFileWithPromise,
  IBucketObject,
  IBucketObjectInternal,
  IBucketObjectWithPromise,
  IBucketObjectWithUrl,
} from "./interfaces";
import { migrate } from "./migration";
import { columnExtensionFile } from "./migration/fileColumnExtension";
import { postProcessingExtensionFile } from "./migration/filePostProcessingExtension";
import { IFileStorageAppConfig, IFileStorageRuntimeConfig } from "./moduleDefinition/interfaces";
import { AuthQueryHelper } from "@soniq/auth/src/AuthQueryHelper";

export { DefaultVerifier, AVerifier, Minio, IBucketObject, IPutObjectCacheSettings, IGetObjectCacheSettings, FileName };
export * from "./interfaces";
export * from "./moduleDefinition";

const schema: string = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

@DI.singleton()
export class FileStorage {
  private _client: Minio.Client;
  private _clientInitialising: boolean = false;
  private _clientInitialised: boolean = false;
  private _logger: Logger;
  private _verifierClasses: { [type: string]: typeof AVerifier } = {};
  private _verifierObjects: { [type: string]: IVerifier } = {};
  private _pgPool: Pool | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _clientInitPromiseResolver: ((value?: any) => void)[] = [];

  private _graphQl: GraphQl;
  private _moduleRuntimeConfig: IFileStorageRuntimeConfig | null = null;
  private _appConfig: IFileStorageAppConfig;
  private _auth: Auth;

  public constructor(@DI.inject(Auth) auth: Auth, @DI.inject(GraphQl) graphQl: GraphQl, @DI.inject(Core) core: Core) {
    this._graphQl = graphQl;
    this._auth = auth;
    this._logger = core.getLogger(this.constructor.name);

    this._appConfig = core.initModule({
      key: this.constructor.name,
      shouldMigrate: this._shouldMigrate.bind(this),
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });

    this.addVerifier("DEFAULT", DefaultVerifier);

    graphQl.addSchemaExtension(schema);

    graphQl.getMigration().addTypeDefsExtension(() => {
      const fileTypes: string[] = Object.keys(this._verifierClasses);

      const fileTypesEnum: string = this._generateGqlEnumType({ name: "FILE_TYPES", options: fileTypes });

      return `${fileTypesEnum}\n`;
    });

    graphQl.getMigration().addColumnExtension(columnExtensionFile);
    graphQl.getMigration().addPostProcessingExtension(postProcessingExtensionFile);

    this._addResolvers();

    this._client = new Minio.Client(this._appConfig.minio);

    for (const key of Object.keys(this._verifierClasses)) {
      const CurrentVerifier: typeof AVerifier = this._verifierClasses[key];
      this._verifierObjects[key] = new CurrentVerifier(this._client, this._appConfig.bucket);
    }

    // TODO: Should be made available somehow
    // this.graphQl.addPostMutationHook(this.postMutationHook.bind(this));
  }

  private _shouldMigrate(): string {
    const fileTypes: string[] = Object.keys(this._verifierClasses);
    return JSON.stringify({ fileTypes, maxTempFilesPerUser: this._appConfig.maxTempFilesPerUser, x: 8 });
  }

  private async _migrate(pgClient: PoolClient): Promise<IModuleMigrationResult> {
    return migrate(this._graphQl, this._appConfig, pgClient);
  }

  private async _boot(moduleRuntimeConfig: {}, pgPool: Pool): Promise<void> {
    this._pgPool = pgPool;
  }

  // TODO: Clean up files
  /* private async _postMutationHook(info, context): Promise<void> {
    try {
      const entityId = info.entityId;
      const result = await this._auth.getAuthQueryHelper().adminQuery("SELECT * FROM _file_storage.file_todelete_by_entity($1);", [entityId]);
      result.rows.forEach((row) => {
        const fileName = new FileName(row);
        this._deleteFileAsAdmin(fileName);
      });
    } catch (e) {
      // I don't care
    }
  } */

  private async _ensureInitializedClient(): Promise<boolean> {
    const client: Minio.Client = this._client;
    if (this._clientInitialised) {
      return true;
    } else {
      if (this._clientInitialising !== true) {
        setTimeout(async () => {
          if (this._clientInitialising !== true) {
            this._clientInitialising = true;
            try {
              // Create a presignedGetUrl for a not existing object to force minio to initialize itself. (Internally, it loads the bucket region)
              // This prevents errors, when large queries require a lot of signed URL's for the first time after boot.
              await client.presignedGetObject(this._appConfig.bucket, "notExistingObject.nothing", 1);

              for (const resolverFunction of this._clientInitPromiseResolver) {
                try {
                  resolverFunction();
                } catch (err) {
                  // Ignore Errors because this is only an Event
                }
              }
            } catch (err) {
              // log error and ignore
              this._logger.warn(err);
            } finally {
              this._clientInitialising = false;
            }
          }
        }, 10);
      }

      return new Promise((resolve) => {
        this._clientInitPromiseResolver.push(resolve);
      });
    }
  }

  private async _presignedPutObject(objectName: string, cacheSettings: IPutObjectCacheSettings): Promise<string> {
    await this._ensureInitializedClient();

    return this._client.presignedPutObject(this._appConfig.bucket, objectName, cacheSettings.expiryInSeconds);
  }

  private async _presignedGetObject(objectName: string, cacheSettings: IGetObjectCacheSettings): Promise<string> {
    await this._ensureInitializedClient();
    const respHeaders: { [header: string]: string } = {};

    if (cacheSettings.cacheControlHeader != null) {
      respHeaders["response-cache-control"] = cacheSettings.cacheControlHeader;
    }
    if (cacheSettings.expiryHeader != null) {
      respHeaders["response-expires"] = cacheSettings.expiryHeader;
    }

    const now: number = Date.now();
    const issueAtDate: Date = new Date(now - (now % (cacheSettings.signIssueTimeReductionModuloInSeconds * 1000)));
    // @types/minio@7.0.2 does not support respHeaders and issueAtDate
    return this._client.presignedGetObject(
      this._appConfig.bucket,
      objectName,
      cacheSettings.expiryInSeconds,
      respHeaders,
      issueAtDate
    );
  }

  private async _deleteFileAsAdmin(fileName: FileName): Promise<void> {
    await this._ensureInitializedClient();
    try {
      await this._auth.getAuthQueryHelper().adminTransaction(async (client) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: QueryResult<any> = await client.query("SELECT * FROM _file_storage.file_deleteone_admin($1);", [
          fileName.id,
        ]);
        if (result.rowCount < 1) {
          throw new Error("Failed to delete file 'fileId' from db.");
        }
        await this._deleteObjects(fileName.prefix);
        return result;
      });
    } catch (e) {
      this._logger.warn("deleteFileAsAdmin.error", `Failed to delete file '${fileName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private async _deleteFile(fileName: FileName, context: { accessToken?: string }): Promise<void> {
    await this._ensureInitializedClient();
    try {
      await this._auth.getAuthQueryHelper().transaction(
        async (client) => {
          await client.query("SELECT * FROM _file_storage.file_deleteone($1);", [fileName.id]);
          await this._deleteObjects(fileName.prefix);
        },
        {
          accessToken: context.accessToken,
        }
      );
    } catch (e) {
      this._logger.warn("deleteFile.error", `Failed to delete file '${fileName.name}'.`, e);
      // I don't care => File will be deleted by a cleanup-script some time
      return;
    }
  }

  private _deleteObjects(filePrefix: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const objectsList: string[] = [];

      const objectsStream: Minio.BucketStream<Minio.BucketItem> = this._client.listObjects(
        this._appConfig.bucket,
        filePrefix,
        true
      );

      objectsStream.on("data", (obj) => {
        objectsList.push(obj.name);
      });

      objectsStream.on("error", (err) => {
        reject(err);
      });

      objectsStream.on("end", async () => {
        try {
          await this._client.removeObjects(this._appConfig.bucket, objectsList);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private _addResolvers(): void {
    this._graphQl.addMutationResolver(
      "createFile",
      false,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
        if (context.accessToken == null) {
          throw new AuthenticationError("Authentication required for create file.");
        }

        return this.createFile(args.extension, args.type, context.accessToken);
      }
    );
    this._graphQl.addMutationResolver(
      "verifyFile",
      false,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
        if (context.accessToken == null) {
          throw new AuthenticationError("Authentication required for verify file.");
        }
        return this.verifyFile(args.fileName, context.accessToken);
      }
    );
    this._graphQl.addMutationResolver(
      "clearUpFiles",
      false,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
        let result: IInput[] = [];

        if (args.fileName != null) {
          const fileName: FileName = new FileName(args.fileName);
          const resultPromise: Promise<{ rows: IInput[] }> = this._auth
            .getAuthQueryHelper()
            .query({ accessToken: context.accessToken }, "SELECT * FROM _file_storage.file_clearupone($1);", [
              fileName.id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ]) as Promise<{ rows: IInput[] }>;
          result = (await resultPromise).rows;
        } else {
          const resultPromise: Promise<{ rows: IInput[] }> = this._auth
            .getAuthQueryHelper()
            .query({ accessToken: context.accessToken }, "SELECT * FROM _file_storage.file_clearup();") as Promise<{
            rows: IInput[];
          }>;
          result = (await resultPromise).rows;
        }

        const filesDeleted: FileName[] = result.map((row) => new FileName(row));

        filesDeleted.forEach((fileName) => {
          // Ignore this eslint problem. We don't care when this fails
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this._deleteFile(fileName, context);
        });

        return filesDeleted.map((fileName) => fileName.name);
      }
    );
    this._graphQl.addResolvers({
      "@fullstack-one/file-storage/readFiles": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            if (obj[info.fieldName] == null) {
              return [];
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fileNames: any = obj[info.fieldName];

            return this.readFiles(fileNames);
          },
        };
      },
    });
  }

  private _generateGqlEnumType(type: { name: string; options: string[] }): string {
    let def: string = `enum ${type.name} {\n`;

    def += type.options
      .map((option) => {
        return `  ${option}\n`;
      })
      .join("");

    def += "}\n";

    return def;
  }

  public addVerifier(type: string, fn: typeof AVerifier): void {
    const regex: string = "^[_a-zA-Z][_a-zA-Z0-9]{3,30}$";
    const regexp: RegExp = new RegExp(regex);
    if (regexp.test(type) !== true) {
      throw new UserInputError(`The type '${type}' has to match RegExp '${regex}'.`);
    }
    if (this._verifierClasses[type] == null) {
      this._verifierClasses[type] = fn;
    } else {
      throw new UserInputError(`A verifier for type '${type}' already exists.`);
    }
  }

  public async createFile(extension: string, type?: string | null, accessToken?: string | null): Promise<IUploadFile> {
    const extensionInternal: string = extension.toLowerCase();
    const typeInternal: string = type || "DEFAULT";

    if (this._verifierObjects[typeInternal] == null) {
      throw new UserInputError(`A verifier for type '${typeInternal}' hasn't been defined.`);
    }

    const authQueryHelper: AuthQueryHelper = this._auth.getAuthQueryHelper();
    let result: QueryResult;

    // tslint:disable-next-line:prefer-conditional-expression
    if (accessToken != null) {
      result = await authQueryHelper.query({ accessToken }, 'SELECT _file_storage.file_create($1, $2) AS "fileId";', [
        extensionInternal,
        typeInternal,
      ]);
    } else {
      result = await authQueryHelper.adminQuery('SELECT _file_storage.file_create_system($1, $2) AS "fileId";', [
        extensionInternal,
        typeInternal,
      ]);
    }

    const fileName: FileName = new FileName({
      id: result.rows[0].fileId,
      type: typeInternal,
      extension: extensionInternal,
    });

    const cacheSettings: IPutObjectCacheSettings = this._verifierObjects[typeInternal].putObjectCacheSettings();

    const presignedPutUrl: string = await this._presignedPutObject(fileName.uploadName, cacheSettings);

    return {
      extension: extensionInternal,
      type: typeInternal,
      fileName: fileName.name,
      uploadFileName: fileName.uploadName,
      presignedPutUrl,
    };
  }

  public async verifyFile(fileNameString: string, accessToken?: string | null): Promise<IBucketFile> {
    await this._ensureInitializedClient();
    const fileName: FileName = new FileName(fileNameString);

    const authQueryHelper: AuthQueryHelper = this._auth.getAuthQueryHelper();
    let result: QueryResult;

    // tslint:disable-next-line:prefer-conditional-expression
    if (accessToken != null) {
      result = await authQueryHelper.query(
        { accessToken },
        'SELECT _file_storage.file_get_type_to_verify($1) AS "type";',
        [fileName.id]
      );
    } else {
      result = await authQueryHelper.query({}, 'SELECT _file_storage.file_get_type_to_verify($1) AS "type";', [
        fileName.id,
      ]);
    }

    const type: string = result.rows[0].type;
    let stat: Minio.BucketItemStat | null = null;

    if (this._verifierObjects[type] == null) {
      throw new UserInputError(`A verifier for type '${type}' hasn't been defined.`);
    }

    if (type !== fileName.type) {
      throw new UserInputError(`FileTypes do not match. Have you changed the fileName? The type should be '${type}'`);
    }

    try {
      stat = await this._client.statObject(this._appConfig.bucket, fileName.uploadName);
    } catch (e) {
      if (e.message.toLowerCase().indexOf("not found") >= 0) {
        throw new UserInputError("Please upload a file before verifying.");
      }
      throw e;
    }

    const verifyFileName: string = fileName.createTempName();

    const verifyCopyConditions: Minio.CopyConditions = new Minio.CopyConditions();
    verifyCopyConditions.setMatchETag(stat.etag);

    await this._client.copyObject(
      this._appConfig.bucket,
      verifyFileName,
      `/${this._appConfig.bucket}/${fileName.uploadName}`,
      verifyCopyConditions
    );

    await this._verifierObjects[type].verify(verifyFileName, fileName);

    if (accessToken != null) {
      await this._auth
        .getAuthQueryHelper()
        .query({ accessToken }, "SELECT _file_storage.file_verify($1);", [fileName.id]);
    } else {
      await this._auth.getAuthQueryHelper().query({}, "SELECT _file_storage.file_verify($1);", [fileName.id]);
    }

    // Try to clean up temp objects. However, don't care if it fails.
    try {
      await this._client.removeObjects(this._appConfig.bucket, [fileName.uploadName, verifyFileName]);
    } catch (err) {
      this._logger.warn("verifyFile.removeObjectsFail", err);
    }

    const verifier: IVerifier = this._verifierObjects[fileName.type];

    const objectNames: IBucketObjectInternal[] = verifier.getObjectNames(fileName);

    const cacheSettings: IGetObjectCacheSettings = verifier.getObjectCacheSettings(fileName);

    const objects: IBucketObjectWithPromise[] = objectNames.map((object) => {
      return {
        objectName: object.objectName,
        info: object.info,
        presignedGetUrlPromise: this._presignedGetObject(object.objectName, cacheSettings),
      };
    });

    const bucketObjects: IBucketObjectWithUrl[] = [];

    for (const object of objects) {
      try {
        bucketObjects.push({
          objectName: object.objectName,
          info: object.info,
          presignedGetUrl: await object.presignedGetUrlPromise,
        });
      } catch (err) {
        this._logger.warn("readFiles.signFail.promise", err);
      }
    }

    return {
      fileName: fileName.name,
      objects: bucketObjects,
    };
  }

  public async readFiles(fileNames: string[]): Promise<IBucketFile[]> {
    const awaitingFileSignatures: IBucketFileWithPromise[] = [];

    for (const fileName of fileNames) {
      try {
        const fName: FileName = new FileName(fileName);

        const verifier: IVerifier = this._verifierObjects[fName.type];

        const objectNames: IBucketObjectInternal[] = verifier.getObjectNames(fName);

        const cacheSettings: IGetObjectCacheSettings = verifier.getObjectCacheSettings(fName);

        const objects: IBucketObjectWithPromise[] = objectNames.map((object) => {
          return {
            objectName: object.objectName,
            info: object.info,
            presignedGetUrlPromise: this._presignedGetObject(object.objectName, cacheSettings),
          };
        });

        awaitingFileSignatures.push({
          fileName,
          objects,
        });
      } catch (err) {
        // Errors can be ignored => Failed Signs are not returned
        this._logger.warn("readFiles.signFail", err);
      }
    }

    const results: IBucketFile[] = [];

    for (const fileObject of awaitingFileSignatures) {
      try {
        const objects: IBucketObject[] = [];
        // const presignedGetUrl = await fileObject.presignedGetUrlPromise;
        const fileName: string = fileObject.fileName;
        for (const object of fileObject.objects) {
          try {
            objects.push({
              objectName: object.objectName,
              info: object.info,
              presignedGetUrl: await object.presignedGetUrlPromise,
            });
          } catch (err) {
            this._logger.warn("readFiles.signFail.promise", err);
          }
        }

        results.push({
          fileName,
          objects,
        });
      } catch (err) {
        // Errors can be ignored => Failed Signs are not returned
        this._logger.warn("readFiles.signFail.promise", err);
      }
    }

    return results;
  }

  public getMinioClient(): Minio.Client {
    return this._client;
  }

  public getBucketName(): string {
    return this._appConfig.bucket;
  }
}
