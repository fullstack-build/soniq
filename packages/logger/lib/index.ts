import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { ILogger, createLogger } from "./createLogger";

export { ILogger };

@Service()
export class LoggerFactory {
  private readonly config: any;

  constructor(@Inject((type) => Config) config: Config) {
    this.config = config.registerConfig("Logger", `${__dirname}/../config`);
  }

  public create(moduleName: string): ILogger {
    const env: IEnvironment = Container.get("ENVIRONMENT");
    return createLogger(moduleName, this.config, env);
  }
}
