import {ISettingsParam, Logger} from "tslog";
export { Logger };

import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { AsyncLocalStorage } from "async_hooks";

const asyncLocalStorage: AsyncLocalStorage<{ "requestId": string }> = new AsyncLocalStorage();
export { asyncLocalStorage };


@Service()
export class LoggerFactory {
  private readonly config: any;
  public readonly logger: Logger;

  constructor(@Inject((type) => Config) config: Config) {
    this.config = config.registerConfig("Logger", `${__dirname}/../config`);
    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.logger = new Logger({
      instanceName: env.nodeId,
      displayInstanceName: true,
      printLogMessageInNewLine: true,
      requestId: (): string => {
        return asyncLocalStorage?.getStore()?.requestId as string;
      }
    });
  }

  public create(name: string, settings: ISettingsParam = {}): Logger {
    return this.logger.getChildLogger({...settings, name});
  }

}

