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

interface ILogObject extends IStackFrame {
  date: Date;
  logLevel: number;
  logLevelName: string;
  argumentsArray: (string | object)[];
  stack?: IStackFrame[];
}

interface IErrorObject {
  isError: true;
  message: string;
  stack: IStackFrame[];
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

  private doOverwriteConsole = false;
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
    doExposeStack: boolean = false
  ): ILogObject {
    const logObject = this.buildLogObject(
      logLevel,
      logArguments,
      doExposeStack
    );
    if (!this.logAsJson) {
      this.printPrettyLog(logObject);
    } else {
      this.printJsonLog(logObject);
    }

    return logObject;
  }

  private buildLogObject(
    logLevel: 0 | 1 | 2 | 3 | 4 | 5,
    logArguments: any[],
    doExposeStack: boolean = true
  ): ILogObject {
    const callSites = this.getCallSites();
    const relevantCallSites = callSites.splice(this.ignoreStackLevels);
    const stackFrame = this.wrapCallSiteOrIgnore(relevantCallSites[0]);
    const stackFrameObject = this.toStackFrameObject(stackFrame);

    const logObject: ILogObject = {
      date: new Date(),
      logLevel: logLevel,
      logLevelName: this.logLevels[logLevel],
      filePath: stackFrameObject.filePath,
      fullFilePath: stackFrameObject.fullFilePath,
      fileName: stackFrameObject.fileName,
      lineNumber: stackFrameObject.lineNumber,
      columnNumber: stackFrameObject.columnNumber,
      isConstructor: stackFrameObject.isConstructor,
      functionName: stackFrameObject.functionName,
      typeName: stackFrameObject.typeName,
      methodName: stackFrameObject.methodName,
      argumentsArray: [],
    };

    logArguments.forEach((arg: any) => {
      if (typeof arg === "object" && !types.isNativeError(arg)) {
        logObject.argumentsArray.push(JSON.parse(JSON.stringify(arg)));
      } else if (typeof arg === "object" && types.isNativeError(arg)) {
        const errorStack = this.getCallSites(arg);
        const errorObject: IErrorObject = JSON.parse(JSON.stringify(arg));
        errorObject.isError = true;
        errorObject.stack = this.toStackObjectArray(errorStack);
        logObject.argumentsArray.push(errorObject);
      } else {
        logObject.argumentsArray.push(format(arg));
      }
    });

    if (doExposeStack) {
      logObject.stack = this.toStackObjectArray(relevantCallSites);
    }

    return logObject;
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

  private printPrettyLog(logObj: ILogObject) {
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
      if (typeof arg === "object" && !arg.isError) {
        std.write(
          "\n" +
            highlight(JSON.stringify(arg, null, 2), { language: "JSON" }) +
            " "
        );
      } else if (typeof arg === "object" && arg.isError) {
        std.write(
          format(
            chalk`\n{whiteBright.bgRed.bold ${arg.name}}{grey :} ${format(
              arg.message
            )}\n`
          )
        );

        this.printPrettyStack(std, arg.stack);
      } else {
        std.write(format(arg + " "));
      }
    });
    std.write("\n");

    if (logObj.stack != null) {
      std.write("log stack:\n");
      this.printPrettyStack(std, logObj.stack);
    }
  }

  private printPrettyStack(
    std: NodeJS.WriteStream,
    stackObjectArray: IStackFrame[]
  ) {
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

  private printJsonLog(logObject: ILogObject) {
    // only errors should go to stdErr
    const std = logObject.logLevel < 5 ? process.stdout : process.stderr;
    std.write(highlight(JSON.stringify(logObject)) + "\n");
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
