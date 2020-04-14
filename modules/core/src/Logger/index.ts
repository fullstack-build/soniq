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
  methodName: string | null;
}

interface ILogMessage extends IStackFrame {
  date: Date;
  msSincePrevious: number;
  logLevel: number;
  logLevelName: string;
  stack: NodeJS.CallSite[];
  argumentsArray: any[];
}

export class Logger {
  private readonly name: string;
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

  constructor(name: string = "", minLevel: number = 0) {
    this.name = name;

    // TODO: catch all errors & exceptions
    if (this.doOverwriteConsole) {
      this.overwriteConsole();
    }

    this.silly("silly", "sully");
    this.trace("trace");
    this.debug("debug");
    this.info("info");
    this.warn("warn");
    this.error("error");
  }

  public silly(...args: any[]) {
    return this.handleLog.apply(this, [0, args]);
  }

  public trace(...args: any[]) {
    return this.handleLog.apply(this, [1, args]);
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
    doPrintStack: boolean = false
  ): ILogMessage {
    const logObj = this.buildLog(logLevel, logArguments);
    this.printLog(logObj, doPrintStack);
    return logObj;
  }

  private buildLog(
    logLevel: 0 | 1 | 2 | 3 | 4 | 5,
    logArguments: any[]
  ): ILogMessage {
    const callsites = this.getCallSites();
    const relevantCallSites = callsites.splice(this.ignoreStackLevels);
    const stackFrame = this.wrapCallSiteOrIgnore(relevantCallSites[0]);
    const stackFrameObject = this.toStackFrameObject(stackFrame);

    return {
      ...stackFrameObject,
      date: new Date(),
      msSincePrevious: 0,
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
      methodName: stackFrame.getMethodName(),
    };
  }

  private printStack(std: NodeJS.WriteStream, stack: NodeJS.CallSite[]) {
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

  private printLog(logObj: ILogMessage, doPrintStack: boolean = false) {
    // send ERROR to stdErr
    const std = logObj.logLevel < 5 ? process.stdout : process.stderr;
    const nowStr = logObj.date.toISOString().replace("T", " ").replace("Z", "");
    const hexColor = this.logLevelsColors[logObj.logLevel];
    let isError: boolean = false;

    std.write(chalk.hex(hexColor)(`${nowStr}\t`));
    std.write(
      chalk.hex(hexColor).bold(` ${logObj.logLevelName.toUpperCase()}\t`)
    );

    std.write(
      chalk.gray(
        `[${logObj.filePath}:${logObj.lineNumber} ${logObj.functionName}.${logObj.methodName} *${logObj.isConstructor}*]\t`
      )
    );

    logObj.argumentsArray.forEach((arg: any) => {
      if (typeof arg === "object" && !types.isNativeError(arg)) {
        std.write(
          highlight(JSON.stringify(arg, null, 2), { language: "JSON" }) + " "
        );
      } else if (typeof arg === "object" && types.isNativeError(arg)) {
        isError = true;
        std.write(
          format(
            chalk`\n{whiteBright.bgRed.bold ${arg.name}}{grey :} ${format(
              arg.message
            )}\n`
          )
        );

        this.printStack(std, this.getCallSites(arg));
      } else {
        std.write(format(arg + " "));
      }
    });
    std.write("\n");

    if (doPrintStack && !isError) {
      this.printStack(std, logObj.stack);
    }
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
