import * as DebugLogger from 'debug-logger';
// import * as LE from 'le_node';
import * as Tracer from 'tracer';

import { IEnvironmentInformation } from '../core/IEnvironmentInformation';
import { ILogger } from './ILogger';
import { ILogObject } from './ILogObject';

export class Logger implements ILogger {
  private LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];

  // Logger Name
  private moduleName: string = null;
  // project environment
  private envInfo: IEnvironmentInformation;
  // tracer
  private tracerLogger: Tracer = null;
  // debug
  private debugLogger: DebugLogger = null;
  // LogEntries
  // private _leNode: any = null;

  // logger config
  private projectEnvString: string;

  constructor(pFullStackOneCore: any, pModuleName: string = 'root') {
    this.moduleName = pModuleName;

    const env = this.envInfo = pFullStackOneCore.getEnvironmentInformation();
    this.projectEnvString = `${env.name}/V.${env.version}/ENV:${env.env}`;

    // setup tracer
    const tracerConfig: any = {
      // min level
      level: pFullStackOneCore.getConfig('logger').minLevel,
      // set log levels
      methods: this.LEVELS,
      // override tracer transport with logToDebug
      transport: this.logToDebug.bind(this),
    };
    this.tracerLogger = Tracer.colorConsole(tracerConfig);

    // setup debug
    this.debugLogger = DebugLogger(`fullstack-one:${this.moduleName}`);

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
