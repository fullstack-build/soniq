import { Logger } from "tslog";
export { Logger };

import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";


@Service()
export class LoggerFactory {
  private readonly config: any;
  private logger: Logger;

  constructor(@Inject((type) => Config) config: Config) {
    this.config = config.registerConfig("Logger", `${__dirname}/../config`);
    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.logger = new Logger({
      instanceName: env.nodeId,
      displayInstanceName: true,
      printLogMessageInNewLine: true });
  }

  public create(name: string): Logger {
    return this.logger.getChildLogger({ name });
  }


}
