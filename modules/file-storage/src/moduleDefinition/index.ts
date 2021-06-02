import { SoniqModule, IModuleConfig, SoniqAppConfigOverwrite, IAppConfig } from "soniq";
import * as _ from "lodash";
import { FileStorage } from "..";
import { IFileStorageAppConfig, IFileStorageAppConfigInput, IFileStorageAppConfigOptional } from "./interfaces";
import { defaultAppConfig } from "./defaultAppConfig";
import { Column } from "@soniq/graphql";

export class FileStorageModule extends SoniqModule {
  private _fileStorageConfig: IFileStorageAppConfig;

  public constructor(fileStorageConfig: IFileStorageAppConfigInput) {
    super("FileStorage");

    this._fileStorageConfig = _.defaultsDeep(fileStorageConfig, defaultAppConfig);
  }

  public _getDiModule(): typeof FileStorage {
    return FileStorage;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._fileStorageConfig,
    };
  }
}

export class FileStorageModuleOverwrite extends SoniqAppConfigOverwrite {
  private _fileStorageConfigOverwrite: IFileStorageAppConfigOptional;

  public constructor(fileStorageConfigOverwrite: IFileStorageAppConfigOptional) {
    super();

    this._fileStorageConfigOverwrite = fileStorageConfigOverwrite;
  }

  public _build(appConfig: IAppConfig): IAppConfig {
    const authModuleIndex: number = appConfig.modules.findIndex((moduleAppConfig: IModuleConfig) => {
      return moduleAppConfig.key === "Auth";
    });

    appConfig.modules[authModuleIndex].appConfig = _.defaultsDeep(
      this._fileStorageConfigOverwrite,
      appConfig.modules[authModuleIndex].appConfig
    );

    return appConfig;
  }
}

export interface IFilesColumnProperties {
  nullable?: boolean;
  defaultExpression?: string;
  types?: string[];
}

export class FilesColumn extends Column {
  public constructor(name: string, properties: IFilesColumnProperties = {}) {
    super(name, "file", properties);

    this._objectTrace = new Error(
      `FilesColumn "${name}" with types "${JSON.stringify(properties.types || ["Default"])}"`
    );
  }
}
