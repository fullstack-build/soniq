import { IModuleConfig, IAppConfig, IApplicationConfig } from "./interfaces";
import { Core, DI, PoolConfig } from "..";
import { IObjectTrace } from "../migration/interfaces";
import { InjectionToken } from "tsyringe";

export class SoniqApp {
  private _modules: SoniqModule[] = [];
  private _environmentsByEnvKey: { [key: string]: SoniqEnvironment } = {};
  private _appId: string;

  public constructor(appId: string) {
    this._appId = appId;
  }
  public async boot(disableAutoMigration: boolean = false): Promise<void> {
    // Find the environment
    const env: string = process.env.NODE_ENV || "development";
    if (this._environmentsByEnvKey[env] == null) {
      throw new Error(`The environment with key "${env}" does not exist in your setup.`);
    }
    const environment: SoniqEnvironment = this._environmentsByEnvKey[env];

    let appConfig: IAppConfig = this._build();

    environment.getAppConfigOverwrites().forEach((appConfigOverwrite: SoniqAppConfigOverwrite) => {
      appConfig = appConfigOverwrite._build(JSON.parse(JSON.stringify(appConfig)));
    });
    const objectTraces: IObjectTrace[] = this._buildObjectTraces();

    const applicationConfig: IApplicationConfig = {
      appConfig,
      objectTraces,
    };

    DI.container.register("ApplicationConfig", { useValue: applicationConfig });

    // Initialise Core
    const core: Core = DI.container.resolve(Core);
    // Initialise all modules
    this._modules.forEach((module: SoniqModule) => {
      const moduleInstance: InjectionToken = module._getDiModule();
      DI.container.resolve(moduleInstance);
    });

    return core.bootApp(environment.getPgConfig(), disableAutoMigration);
  }
  public addModules(...modules: SoniqModule[]): void {
    modules.forEach((module) => {
      this._addModule(module);
    });
  }
  public addEnvironments(...environments: SoniqEnvironment[]): void {
    environments.forEach((environment) => {
      this._addEnvironment(environment);
    });
  }
  public _build(): IAppConfig {
    const modules: IModuleConfig[] = this._modules.map((module) => {
      return module._build(this._appId);
    });

    modules.push({
      key: "Core",
      appConfig: {},
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

  private _addModule(module: SoniqModule): void {
    for (const loopModule of this._modules) {
      if (module.getModuleKey() === loopModule.getModuleKey()) {
        throw new Error(`SoniqModule with key ${module.getModuleKey()} is added twice.`);
      }
    }
    this._modules.push(module);
  }
  private _addEnvironment(environment: SoniqEnvironment): void {
    if (this._environmentsByEnvKey[environment.getEnvKey()] != null) {
      throw new Error(`SoniqEnvironment with key ${environment.getEnvKey()} is added twice.`);
    }
    this._environmentsByEnvKey[environment.getEnvKey()] = environment;
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

  public _getDiModule(): InjectionToken {
    throw new Error("_getDiModule is not implemented for SoniqModule Interface");
  }

  public _build(appId: string): IModuleConfig {
    throw new Error("_build is not implemented for SoniqModule Interface");
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
