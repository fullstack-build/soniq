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
import { Logger } from "./Logger";
import { BootLoader } from "./BootLoader";
import { ConfigManager, IEnvironment } from "./ConfigManager";
export { IEnvironment };

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

@Service("@soniq")
export class Core {
  private readonly className = this.constructor.name;
  private readonly bootLoader: BootLoader = new BootLoader();
  public readonly configManager: ConfigManager | undefined;
  public readonly ENVIRONMENT: IEnvironment;
  private readonly logger: Logger;

  private constructor() {
    this.configManager = new ConfigManager();
    this.ENVIRONMENT = this.configManager.ENVIRONMENT;
    Container.set(
      "@soniq/ENVIRONMENT",
      JSON.parse(JSON.stringify(this.ENVIRONMENT))
    );
    this.logger = new Logger(this.ENVIRONMENT.nodeId, { name: this.className });
  }

  // draw CLI art
  private drawCliArt(): void {
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
    process.stdout.write(JSON.stringify(this.ENVIRONMENT, null, 2));
    process.stdout.write("====================================\n");
  }

  public async boot() {
    await this.bootLoader.boot();
    this.drawCliArt();
    return;
  }

  public getLogger(name?: string, minLevel: number = 0, exposeStack = false) {
    return new Logger(this.ENVIRONMENT.nodeId, { name, minLevel, exposeStack });
  }
}
