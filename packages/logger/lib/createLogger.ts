import * as DebugLogger from "debug-logger";
import { Tracer, colorConsole } from "tracer";
import { IEnvironment } from "@fullstack-one/config";

export type ILogger = Tracer.Logger;

export function createLogger(moduleName: string = "root", loggerConfig: any, env: IEnvironment): ILogger {
  const levels = ["trace", "debug", "info", "warn", "error"];
  const loggerName = `${env.namespace}:${env.nodeId}:${moduleName}`;
  const debugLogger = DebugLogger(loggerName);

  const tracerConfig: Tracer.LoggerConfig = {
    level: loggerConfig.minLevel,
    methods: levels,
    transport: (logObject: Tracer.LogOutput): void => debugLogger[logObject.title](logObject.output)
  };

  const tracerLogger: Tracer.Logger = colorConsole(tracerConfig);

  return tracerLogger;
}
