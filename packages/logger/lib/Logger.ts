
import { Container, Service, Inject } from '@fullstack-one/di';
import { Config } from '@fullstack-one/config';
import * as DebugLogger from 'debug-logger';
// import * as LE from 'le_node';
import * as Tracer from 'tracer';
import { ILogger } from './ILogger';
import { ILogObject } from './ILogObject';

export class Logger implements ILogger {
  private LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];

  private loggerName: string;

  // tracer
  private tracerLogger: Tracer = null;
  // debug
  private debugLogger: DebugLogger = null;
  // LogEntries
  // private _leNode: any = null;

  // logger config
  private projectEnvString: string;

  constructor(moduleName: string = 'root', config) {

    const env: any = Container.get('ENVIRONMENT');
    // const config: any = Container.get('CONFIG');

    this.loggerName = `${env.namespace}:${env.nodeId}:${moduleName}`;
    this.projectEnvString = `${env.name}/V.${env.version}/ENV:${env.NODE_ENV}/I:${env.nodeId}`;

    const loggerConfig = config.getConfig('logger');

    // setup tracer
    const tracerConfig: any = {
      // min level
      level: loggerConfig.minLevel,
      // set log levels
      methods: this.LEVELS,
      // override tracer transport with logToDebug
      transport: this.logToDebug.bind(this),
    };
    this.tracerLogger = Tracer.colorConsole(tracerConfig);

    // setup debug
    this.debugLogger = DebugLogger(this.loggerName);

    /*
    // setup LogEntries
    const LOGENTRIES_CONFIG = this._CONFIG_LOGGER.logEntries || {};
    // set log levels
    LOGENTRIES_CONFIG.levels = this._LEVELS;
    this._leNode = new LE(LOGENTRIES_CONFIG);
    */

    // overriding class with tracer API
    return this.tracerLogger;
  }

  /**
   * Empty functions for code completion
   * implementation is within tracer
   */
  public trace(...args: any[]) {
    // no function
  }

  public debug(...args: any[]) {
    // no function
  }

  public info(...args: any[]) {
    // no function
  }

  public warn(...args: any[]) {
    // no function
  }

  public error(...args: any[]) {
    // no function
  }

  /**
   *  PRIVATE METHODS
   */
  private logToDebug(pLogObject: ILogObject) {
    // use tracer output to log message to DEBUG
    this.debugLogger[pLogObject.title](pLogObject.output);

    // adjust for log entries
    const logArgs = { ...pLogObject.args }; // copy
    delete logArgs[0];

    /*
    const logEntry: any = {
      env:       this.envInfo.env,
      timestamp: pLogObject.timestamp,
      module:    this.moduleName,
      path:      pLogObject.path,
      file:      pLogObject.file,
      pos:       `${pLogObject.line}:${pLogObject.pos}`,
      method:    pLogObject.method,
      message:   pLogObject.args[0],
      args:      logArgs,
      stack:     pLogObject.stack,
    };

    // log remotely to logentries
    this._leNode[pLogObject.title](logEntry);
    */
  }
}
