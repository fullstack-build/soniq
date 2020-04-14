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
export { Logger };

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

@Service("@fullstack-one/core")
export class Core {
  private readonly className = this.constructor.name;
  private readonly logger: Logger = new Logger(this.className);
  private readonly bootLoader: BootLoader = new BootLoader();
  public readonly configManager: ConfigManager | undefined;
  public readonly ENVIRONMENT: IEnvironment | undefined;

  private constructor() {
    this.configManager = new ConfigManager();
    this.ENVIRONMENT = this.configManager.ENVIRONMENT;
    Container.set(
      "@fullstack-one/ENVIRONMENT",
      JSON.parse(JSON.stringify(this.ENVIRONMENT))
    );
    this.logger.trace("###huhu", "haha!!!!");
    this.logger.error("ERROR!");
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
}
