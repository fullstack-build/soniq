import { Service, Inject, Core, IEnvironment } from "@fullstack-one/core";
// @ts-ignore
import * as DebugLogger from "debug-logger";
import { Tracer, colorConsole } from "tracer";

export type ILogger = Tracer.Logger;
export type ILoggerMethods<T> = Tracer.LevelOption<T>;

@Service("@fullstack-one/logger")
export class Logger {
  private readonly config: any;
  private attachedLogger: Tracer.LevelOption<() => void> = {};

  constructor(
    @Inject("@fullstack-one/core")
    private _core: Core,
    @Inject("@fullstack-one/ENVIRONMENT")
    private readonly ENVIRONMENT: IEnvironment
  ) {
    this.config = this._core?.configManager.registerConfig(
      this.constructor.name,
      `${__dirname}/../config`
    );
  }

  public create(moduleName: string): ILogger {
    // return createLogger(moduleName, this.config, env);
    const levels = ["trace", "debug", "info", "warn", "error"];
    const loggerName = `${this.ENVIRONMENT.namespace}:${this.ENVIRONMENT.nodeId}:${moduleName}`;
    const debugLogger = DebugLogger(loggerName);

    const tracerConfig: Tracer.LoggerConfig = {
      level: this.config.minLevel,
      methods: levels,
      inspectOpt: {
        showHidden: true,
        depth: 0,
      },
      transport: (logObject: Tracer.LogOutput): void => {
        if (this.attachedLogger[logObject.title]) {
          this.attachedLogger[logObject.title](logObject);
        }

        return debugLogger[logObject.title](logObject.output);
      },
    };

    return colorConsole(tracerConfig) as Tracer.Logger;
  }

  public attach(
    loggerToBeAttached: ILoggerMethods<(...args: any[]) => void>
  ): void {
    this.attachedLogger = loggerToBeAttached;
  }
}
