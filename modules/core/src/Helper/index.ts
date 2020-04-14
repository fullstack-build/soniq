import { sep as pathSeparator } from "path";
export class Helper {
  public static cwdArray = process.cwd().split(pathSeparator);

  public static cleanUpFilePath(fileName: string | null): string | null {
    if (fileName == null) {
      return fileName;
    }
    return Object.entries(fileName.split(pathSeparator)).reduce(
      (cleanFileName: string, fileNamePart) =>
        cleanFileName + (Helper.cwdArray[fileNamePart[0]] !== fileNamePart[1])
          ? fileNamePart[1]
          : "",
      ""
    );
  }
}
