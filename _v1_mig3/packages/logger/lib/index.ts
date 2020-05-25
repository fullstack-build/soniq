import * as DebugLogger from "debug-logger";
import { Tracer, colorConsole } from "tracer";

import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";

export type ILogger = Tracer.Logger;

@Service()
export class LoggerFactory {
  private readonly config: any;

  constructor(@Inject((type) => Config) config: Config) {
    this.config = config.registerConfig("Logger", `${__dirname}/../config`);
  }

  public create(moduleName: string): ILogger {
    const env: IEnvironment = Container.get("ENVIRONMENT");
    // return createLogger(moduleName, this.config, env);
    const levels = ["trace", "debug", "info", "warn", "error"];
    const loggerName = `${env.namespace}:${env.nodeId}:${moduleName}`;
    const debugLogger = DebugLogger(loggerName);

    const tracerConfig: Tracer.LoggerConfig = {
      level: this.config.minLevel,
      methods: levels,
      inspectOpt: {
        showHidden: true,
        depth: null
      },
      transport: (logObject: Tracer.LogOutput): void => debugLogger[logObject.title](logObject.output)
    };

    const tracerLogger: Tracer.Logger = colorConsole(tracerConfig);

    return tracerLogger;
  }
}
