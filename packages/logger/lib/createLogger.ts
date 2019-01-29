import * as DebugLogger from "debug-logger";
import { Tracer, colorConsole } from "tracer";
import { IEnvironment } from "@fullstack-one/config";

export type ILogger = Tracer.Logger;

export function createLogger(moduleName: string = "root", loggerConfig: any, env: IEnvironment): ILogger {
  const levels = ["trace", "debug", "info", "warn", "error"];
  const loggerName = `${env.namespace}:${env.nodeId}:${moduleName}`;

  const tracerConfig: Tracer.LoggerConfig = {
    level: loggerConfig.minLevel,
    methods: levels,
    transport: getDebugLoggerTransportFunction(loggerConfig)
  };

  const tracerLogger: Tracer.Logger = colorConsole(tracerConfig);

  return tracerLogger;
}

function getDebugLoggerTransportFunction(loggerName: string): Tracer.TransportFunction {
  const debugLogger = DebugLogger(loggerName);
  return (logObject: Tracer.LogOutput): void => {
    // use tracer output to log message to DEBUG
    debugLogger[logObject.title](logObject.output);

    // adjust for log entries
    const logArgs = { ...logObject.args };
    delete logArgs[0];
  };
}
