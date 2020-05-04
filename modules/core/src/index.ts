import "reflect-metadata";
// DI
import {
  Service,
  Container,
  ContainerInstance,
  Inject,
  InjectMany,
} from "typedi";
export { Service, Container, ContainerInstance, Inject, InjectMany };
import { Logger, TLogLevelName } from "tslog";
import { BootLoader } from "./BootLoader";
import { ConfigManager, IEnvironment } from "./ConfigManager";
export { IEnvironment };
export { Logger };

// TODO: move somewhere else later
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

@Service()
export class Core {
  private readonly _className: string = this.constructor.name;
  private readonly _bootLoader: BootLoader;
  private readonly _logger: Logger;
  public readonly configManager: ConfigManager;
  public readonly ENVIRONMENT: IEnvironment;

  public constructor() {
    this.configManager = new ConfigManager();
    this.ENVIRONMENT = this.configManager.ENVIRONMENT;
    Container.set(
      "@soniq/ENVIRONMENT",
      JSON.parse(JSON.stringify(this.ENVIRONMENT))
    );
    // TODO: catch all errors & exceptions
    this._logger = new Logger({
      instanceName: this.ENVIRONMENT.nodeId,
      name: this._className,
      displayInstanceName: true,
    });
    this._bootLoader = new BootLoader(this._logger);
  }

  // draw CLI art
  private _drawCliArt(): void {
    process.stdout.write(
      `     
  ___  ___  _ __  _  __ _ 
 / __|/ _ \\| '_ \\| |/ _\` |
 \\__ \\ (_) | | | | | (_| |
 |___/\\___/|_| |_|_|\\__, |
                       | |
                       |_|\n`
    );
    process.stdout.write("____________________________________\n");
    process.stdout.write(JSON.stringify(this.ENVIRONMENT, undefined, 2) + "\n");
    process.stdout.write("====================================\n");
  }

  public async boot(): Promise<void> {
    await this._bootLoader.boot();
    this._drawCliArt();
    return;
  }

  public getLogger(
    name?: string,
    minLevel: TLogLevelName = "silly",
    exposeStack: boolean = false
  ): Logger {
    return new Logger({
      instanceName: this.ENVIRONMENT.nodeId,
      name,
      minLevel,
      exposeStack,
      displayInstanceName: true,
    });
  }
}
