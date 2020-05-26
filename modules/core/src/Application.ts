import { IModuleConfig, IAppConfig, IObjectTrace } from "./interfaces";
import { PoolConfig } from ".";

export class SoniqApp {
  private _modules: SoniqModule[] = [];
  private _appId: string;

  public constructor(appId: string) {
    this._appId = appId;
  }
  public addModule(module: SoniqModule): void {
    for (const loopModule of this._modules) {
      if (module.getModuleKey() === loopModule.getModuleKey()) {
        throw new Error(`SoniqModule with key ${module.getModuleKey()} is added twice.`);
      }
    }
    this._modules.push(module);
  }
  public _build(): IAppConfig {
    const modules: IModuleConfig[] = this._modules.map((module) => {
      return module._build(this._appId);
    });

    return {
      modules,
    };
  }
  public _buildObjectTraces(): IObjectTrace[] {
    const objectTraces: IObjectTrace[] = [];

    this._modules.forEach((module) => {
      module._buildObjectTraces(this._appId).forEach((objectTrace: IObjectTrace) => {
        objectTraces.push(objectTrace);
      });
    });

    return objectTraces;
  }
}

export class SoniqModule {
  private _moduleKey: string;

  public constructor(moduleKey: string) {
    this._moduleKey = moduleKey;
  }

  public getModuleKey(): string {
    return this._moduleKey;
  }

  public _build(appId: string): IModuleConfig {
    throw new Error("Build is not implemented for SoniqModule Interface");
  }

  public _buildObjectTraces(appId: string): IObjectTrace[] {
    return [];
  }
}

export class SoniqAppConfigOverwrite {
  public _build(appConfig: IAppConfig): IAppConfig {
    throw new Error("Build is not implemented for SoniqModuleOverwrite Interface");
  }
}

export class SoniqEnvironment {
  private _envKey: string;
  private _pgConfig: PoolConfig;
  private _appConfigOverwrites: SoniqAppConfigOverwrite[] = [];

  public constructor(envKey: string, pgConfig: PoolConfig) {
    this._envKey = envKey;
    this._pgConfig = pgConfig;
  }

  public getEnvKey(): string {
    return this._envKey;
  }

  public addAppConfigOverwrite(moduleOverwrite: SoniqAppConfigOverwrite): void {
    this._appConfigOverwrites.push(moduleOverwrite);
  }

  public getAppConfigOverwrites(): SoniqAppConfigOverwrite[] {
    return this._appConfigOverwrites;
  }

  public getPgConfig(): PoolConfig {
    return this._pgConfig;
  }
}
