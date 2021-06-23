import { PoolClient } from "pg";
import { Core, DI, Pool } from "..";
import { drawCliArt, getLatestNMigrations } from "../helpers";
import { IModuleMigrationResult } from "../migration/interfaces";
import { SoniqApp, SoniqEnvironment, SoniqModule } from "../moduleDefinition";
import { IModuleConfig } from "../moduleDefinition/interfaces";

interface IJestTestAppConfig {
  testBoolean: boolean;
}

interface IJestTestAppConfigInput {
  testBoolean?: boolean;
}

const defaultAppConfig: IJestTestAppConfig = {
  testBoolean: false
};

@DI.singleton()
export class JestTest {
  private _core: Core;
  private _appConfig: IJestTestAppConfig;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@DI.inject(Core) core: Core) {
    this._core = core;

    this._appConfig = this._core.initModule({
      key: this.constructor.name,
      shouldMigrate: this._shouldMigrate.bind(this),
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this)
    });
  }

  private async _boot(moduleRunConfig: {}, pgPool: Pool): Promise<void> {
    console.log("Boot");
  }

  private _shouldMigrate(): string {
    return "foobar";
  }

  private async _migrate(pgClient: PoolClient): Promise<IModuleMigrationResult> {
    console.log("Migrate");
    return {
      errors: [],
      warnings: [],
      commands: [],
      moduleRunConfig: {}
    }
  }
}

describe("CoreModulesTest", () => {
  const app: SoniqApp = new SoniqApp("a3af9ea0-11a7-4eb0-96a0-7be79f827779");

  const testEnv: SoniqEnvironment = new SoniqEnvironment("test", {
    user: "postgres",
    host: "localhost",
    database: "soniq-jest-test-core",
    password: "",
    port: 5432,
  });


  class JestTestModule extends SoniqModule {
    private _appConfig: IJestTestAppConfig;

    public constructor(appConfig: IJestTestAppConfigInput) {
      super("JestTest");

      this._appConfig = {
        ...defaultAppConfig,
        ...appConfig,
      };
    }

    public _getDiModule(): typeof JestTest {
      return JestTest;
    }

    public _build(): IModuleConfig {
      return {
        key: this.getModuleKey(),
        appConfig: this._appConfig,
      };
    }
  }

  it("should be possible to add a environment", async () => {
    app.addEnvironments(testEnv);
  });

  it("should be possible to add a module", async () => {
    const jestTestModule = new JestTestModule({ testBoolean: true });
    
    app.addModules(jestTestModule);
  });

  it("should be possible to boot soniq", async () => {
    await app.boot()
  });
})

