import * as DebugLogger from "debug-logger";
import { Tracer, colorConsole } from "tracer";

import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";

export type ILogger = Tracer.Logger;
export type ILoggerMethods<T> = Tracer.LevelOption<T>;

@Service()
export class LoggerFactory {
  private readonly config: any;
  private attachedLogger: Tracer.LevelOption<() => void> = {};

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
      transport: (logObject: Tracer.LogOutput): void => {
        if (this.attachedLogger[logObject.title]) {
          this.attachedLogger[logObject.title](logObject);
        }

        return debugLogger[logObject.title](logObject.output);
      }
    };

    const tracerLogger: Tracer.Logger = colorConsole(tracerConfig);

    return tracerLogger;
  }

  public attach(loggerToBeAttached: ILoggerMethods<(...args) => void>): void {
    this.attachedLogger = loggerToBeAttached;
  }
}
