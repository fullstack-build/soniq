import { wrapCallSite } from "source-map-support";
import * as chalk from "chalk";
import { highlight } from "cli-highlight";
import { Helper } from "../Helper";
import { basename as fileBasename, normalize as fileNormalize } from "path";
import { format, types } from "util";

interface IStackFrame {
  filePath: string;
  fullFilePath: string;
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
  isConstructor: boolean | null;
  functionName: string | null;
  typeName: string | null;
  methodName: string | null;
}

interface ILogMessageObject extends IStackFrame {
  date: Date;
  logLevel: number;
  logLevelName: string;
  argumentsArray: any[];
  stack: NodeJS.CallSite[];
}

interface ILogObject extends IStackFrame {
  date: Date;
  logLevel: number;
  logLevelName: string;
  argumentsArray: (string | object)[];
  stack?: IStackFrame[];
}

export class Logger {
  private readonly logLevels = {
    0: "silly",
    1: "trace",
    2: "debug",
    3: "info",
    4: "warn",
    5: "error",
  };

  private readonly logLevelsColors = {
    0: "#B0B0B0",
    1: "#FFFFFF",
    2: "#63C462",
    3: "#2020C0",
    4: "#CE8743",
    5: "#CD444C",
  };

  private ignoreStackLevels = 3;

  private doOverwriteConsole = true;
  private logAsJson = true;

  constructor(
    private nodeId: string,
    private name: string,
    minLevel: number = 0
  ) {
    this.errorToJsonHelper();
    // TODO: catch all errors & exceptions
    // Log as json
    // remove ms
    // transport (inkl. min level)
    // config
    // override console.log
    // print out logger name, if set
    if (this.doOverwriteConsole) {
      this.overwriteConsole();
    }
  }
  public silly(...args: any[]) {
    return this.handleLog.apply(this, [0, args]);
  }

  public trace(...args: any[]) {
    return this.handleLog.apply(this, [1, args, true]);
  }

  public debug(...args: any[]) {
    return this.handleLog.apply(this, [2, args]);
  }

  public info(...args: any[]) {
    return this.handleLog.apply(this, [3, args]);
  }

  public warn(...args: any[]) {
    return this.handleLog.apply(this, [4, args]);
  }

  public error(...args: any[]) {
    return this.handleLog.apply(this, [5, args]);
  }

  private handleLog(
    logLevel: 0 | 1 | 2 | 3 | 4 | 5,
    logArguments: any[],
    doPrintStack: boolean = true
  ): ILogMessageObject {
    const logObj = this.buildLog(logLevel, logArguments);
    if (!this.logAsJson) {
      this.printPrettyLog(logObj, doPrintStack);
    } else {
      this.printJsonLog(this.getJsonLog(logObj, doPrintStack), doPrintStack);
    }

    return logObj;
  }

  private buildLog(
    logLevel: 0 | 1 | 2 | 3 | 4 | 5,
    logArguments: any[]
  ): ILogMessageObject {
    const callSites = this.getCallSites();
    const relevantCallSites = callSites.splice(this.ignoreStackLevels);
    const stackFrame = this.wrapCallSiteOrIgnore(relevantCallSites[0]);
    const stackFrameObject = this.toStackFrameObject(stackFrame);

    return {
      ...stackFrameObject,
      date: new Date(),
      logLevel: logLevel,
      logLevelName: this.logLevels[logLevel],
      stack: relevantCallSites,
      argumentsArray: logArguments,
    };
  }

  private toStackObjectArray(jsStack: NodeJS.CallSite[]): IStackFrame[] {
    let prettyStack: IStackFrame[] = Object.values(jsStack).reduce(
      (iPrettyStack: IStackFrame[], stackFrame: NodeJS.CallSite) => {
        iPrettyStack.push(
          this.toStackFrameObject(this.wrapCallSiteOrIgnore(stackFrame))
        );
        return iPrettyStack;
      },
      []
    );
    return prettyStack;
  }

  private toStackFrameObject(stackFrame: NodeJS.CallSite): IStackFrame {
    const filePath = stackFrame.getFileName();

    return {
      filePath: Helper.cleanUpFilePath(filePath) ?? "",
      fullFilePath: filePath ?? "",
      fileName: fileBasename(stackFrame.getFileName() ?? ""),
      lineNumber: stackFrame.getLineNumber(),
      columnNumber: stackFrame.getColumnNumber(),
      isConstructor: stackFrame.isConstructor(),
      functionName: stackFrame.getFunctionName(),
      typeName: stackFrame.getTypeName(),
      methodName: stackFrame.getMethodName(),
    };
  }

  private printPrettyLog(
    logObj: ILogMessageObject,
    doPrintStack: boolean = false
  ) {
    // only errors should go to stdErr
    const std = logObj.logLevel < 5 ? process.stdout : process.stderr;
    const nowStr = logObj.date.toISOString().replace("T", " ").replace("Z", "");
    const hexColor = this.logLevelsColors[logObj.logLevel];

    std.write(chalk.hex(hexColor)(`${nowStr}\t`));
    std.write(
      chalk.hex(hexColor).bold(` ${logObj.logLevelName.toUpperCase()}\t`)
    );

    const functionName = logObj.isConstructor
      ? `${logObj.typeName}.constructor`
      : logObj.methodName != null
      ? `${logObj.typeName}.${logObj.methodName}`
      : `${logObj.functionName}`;
    std.write(
      chalk.gray(
        `[@${this.nodeId} ${logObj.filePath}:${logObj.lineNumber} ${functionName}]\t`
      )
    );

    logObj.argumentsArray.forEach((arg: any) => {
      if (typeof arg === "object" && !types.isNativeError(arg)) {
        std.write(
          "\n" +
            highlight(JSON.stringify(arg, null, 2), { language: "JSON" }) +
            " "
        );
      } else if (typeof arg === "object" && types.isNativeError(arg)) {
        std.write(
          format(
            chalk`\n{whiteBright.bgRed.bold ${arg.name}}{grey :} ${format(
              arg.message
            )}\n`
          )
        );

        this.printPrettyStack(std, this.getCallSites(arg));
      } else {
        std.write(format(arg + " "));
      }
    });
    std.write("\n");

    if (doPrintStack) {
      std.write("log stack:\n");
      this.printPrettyStack(std, logObj.stack);
    }
  }

  private printPrettyStack(std: NodeJS.WriteStream, stack: NodeJS.CallSite[]) {
    const stackObjectArray = this.toStackObjectArray(stack);
    std.write("\n");
    Object.values(stackObjectArray).forEach((stackObject: IStackFrame) => {
      std.write(
        chalk`    {grey •} {yellowBright ${
          stackObject.fileName
        }}{grey :}{yellow ${stackObject.lineNumber}} {white ${
          stackObject.functionName ?? "<anonumous>"
        }}`
      );
      std.write("\n    ");
      std.write(
        fileNormalize(
          chalk`{grey ${stackObject.fullFilePath}:${stackObject.lineNumber}:${stackObject.columnNumber}}`
        )
      );
      std.write("\n\n");
    });
  }

  private printJsonLog(logObject: ILogObject, doPrintStack: boolean = false) {
    // only errors should go to stdErr
    const std = logObject.logLevel < 5 ? process.stdout : process.stderr;
    std.write(highlight(JSON.stringify(logObject, null, 2)) + "\n\n");
  }

  private getJsonLog(
    logObj: ILogMessageObject,
    doPrintStack: boolean = false
  ): ILogObject {
    const logObject: ILogObject = {
      filePath: logObj.filePath,
      fullFilePath: logObj.fullFilePath,
      fileName: logObj.fileName,
      lineNumber: logObj.lineNumber,
      columnNumber: logObj.columnNumber,
      isConstructor: logObj.isConstructor,
      functionName: logObj.functionName,
      typeName: logObj.typeName,
      methodName: logObj.methodName,
      date: logObj.date,
      logLevel: logObj.logLevel,
      logLevelName: logObj.logLevelName,
      argumentsArray: [],
    };

    logObj.argumentsArray.forEach((arg: any) => {
      if (typeof arg === "object" && !types.isNativeError(arg)) {
        logObject.argumentsArray.push(JSON.parse(JSON.stringify(arg)));
      } else if (typeof arg === "object" && types.isNativeError(arg)) {
        const errorStack = this.getCallSites(arg);
        const errorObject = JSON.parse(JSON.stringify(arg));
        errorObject.stack = this.toStackObjectArray(errorStack);
        logObject.argumentsArray.push(errorObject);
      } else {
        logObject.argumentsArray.push(format(arg));
      }
    });

    if (doPrintStack) {
      logObject.stack = this.toStackObjectArray(logObj.stack);
    }

    return logObject;
  }

  private wrapCallSiteOrIgnore(
    callSiteFrame: NodeJS.CallSite
  ): NodeJS.CallSite {
    try {
      return wrapCallSite(callSiteFrame);
    } catch {
      return callSiteFrame;
    }
  }

  private getCallSites(error?: Error): NodeJS.CallSite[] {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack =
      error == null ? (new Error().stack as any).slice(1) : error.stack;
    Error.prepareStackTrace = _prepareStackTrace;
    return stack;
  }

  private errorToJsonHelper(): void {
    if (!("toJSON" in Error.prototype))
      Object.defineProperty(Error.prototype, "toJSON", {
        value: function () {
          return Object.getOwnPropertyNames(this).reduce(
            (alt: any, key: string) => {
              alt[key] = this[key];
              return alt;
            },
            {}
          );
        },
        configurable: true,
        writable: true,
      });
  }

  private overwriteConsole() {
    const $this = this;
    ["log", "debug", "info", "warn", "trace", "error"].forEach(function (name) {
      /*console[name] = (...args: any[]) => {
        // force console.log!!
        return $this.handleLog.apply($this, [5, args]);
      };*/
    });
  }
}
