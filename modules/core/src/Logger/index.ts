import { wrapCallSite } from "source-map-support";
import * as chalk from "chalk";
// @ts-ignore
import * as jsome from "jsome";
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

const getCallSites = (error?: Error): NodeJS.CallSite[] => {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack =
    error == null ? (new Error().stack as any).slice(1) : error.stack;
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
};

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

    jsome.colors = {
      num: "cyan", // stands for numbers
      str: "blueBright", // stands for strings
      bool: "red", // stands for booleans
      regex: "blue", // stands for regular expressions
      undef: "grey", // stands for undefined
      null: "grey", // stands for null
      attr: "whiteBright", // objects attributes -> { attr : value }
      quot: "white", // strings quotes -> "..."
      punc: "white", // commas separating arrays and objects values -> [ , , , ]
      brack: "white", // for both {} and []
    };

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
    doPrintStack: boolean = true
  ): ILogMessage {
    const logObj = this.buildLog(logLevel, logArguments);
    this.printLog(logObj, doPrintStack);
    return logObj;
  }

  private buildLog(
    logLevel: 0 | 1 | 2 | 3 | 4 | 5,
    logArguments: any[]
  ): ILogMessage {
    const stack = getCallSites();
    const relevantStack = stack.splice(0, this.ignoreStackLevels);
    const stackFrame = this.unwrapJsStackOrFallBack(relevantStack)[0];
    const stackFrameObject = this.toStackFrameObject(stackFrame);

    return {
      ...stackFrameObject,
      date: new Date(),
      msSincePrevious: 0,
      logLevel: logLevel,
      logLevelName: this.logLevels[logLevel],
      stack: stack,
      argumentsArray: logArguments,
    };
  }

  private unwrapJsStackOrFallBack(
    jsStack: NodeJS.CallSite[]
  ): NodeJS.CallSite[] {
    const tsStackTraceFirstEntry = wrapCallSite(jsStack[0]);
    if (tsStackTraceFirstEntry == null) {
      return jsStack;
    } else {
      const tsStack: NodeJS.CallSite[] = [];
      Object.values(jsStack).forEach((jsStackFrame: NodeJS.CallSite) => {
        const tsStackFrame = wrapCallSite(jsStackFrame);
        tsStack.push(tsStackFrame);
      });
      return tsStack;
    }
  }

  private toStackObjectArray(jsStack: NodeJS.CallSite[]): IStackFrame[] {
    const stack = this.unwrapJsStackOrFallBack(jsStack);

    let prettyStack: IStackFrame[] = Object.values(stack).reduce(
      (iPrettyStack: IStackFrame[], stackFrame: NodeJS.CallSite) => {
        iPrettyStack.push(this.toStackFrameObject(stackFrame));
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
    Object.values(stackObjectArray).forEach((stackObject: IStackFrame) => {
      std.write(
        chalk`    {grey •} {yellowBright ${stackObject.fileName}}{grey :}{yellow ${stackObject.lineNumber}} {white ${stackObject.functionName}}`
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
        `[${logObj.fileName}:${logObj.lineNumber} ${logObj.functionName}.${logObj.methodName} *${logObj.isConstructor}*]\t`
      )
    );

    logObj.argumentsArray.forEach((arg: any) => {
      if (typeof arg === "object" && !types.isNativeError(arg)) {
        std.write(jsome(arg));
      } else if (typeof arg === "object" && types.isNativeError(arg)) {
        isError = true;
        std.write(
          format(
            chalk`\n{whiteBright.bgRed.bold ${arg.name}}{grey :} ${format(
              arg.message
            )}\n`
          )
        );

        this.printStack(std, getCallSites(arg));
      } else {
        std.write(format(arg + " "));
      }
    });
    std.write("\n");

    if (doPrintStack && !isError) {
      this.printStack(std, logObj.stack);
    }
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
