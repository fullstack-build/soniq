import * as fastGlob from "fast-glob";
import { readFile } from "fs";
import { promisify } from "util";
const readFileAsync = promisify(readFile);

export abstract class AHelper {
  public static async loadFilesByGlobPattern(pattern: string): Promise<string[]> {
    try {
      const files = fastGlob.sync(pattern, { deep: false, onlyFiles: true });

      const readFilesPromises: Array<Promise<string>> = [];
      files.map((filePath: any) => {
        readFilesPromises.push(readFileAsync(filePath, "utf8"));
      });

      return await Promise.all(readFilesPromises);
    } catch (err) {
      throw err;
    }
  }

  public static async requireFilesByGlobPattern(pattern: string): Promise<any[]> {
    try {
      const files = await fastGlob.sync(pattern, { deep: false, onlyFiles: true });

      const requiredFiles: any[] = [];
      files.map((filePath: any) => {
        let requiredFileContent: any = null;
        try {
          const requiredFile = require(filePath);
          requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;
        } catch (err) {
          throw err;
        }

        requiredFiles.push(requiredFileContent);
      });

      return requiredFiles;
    } catch (err) {
      throw err;
    }
  }

  public static async requireFilesByGlobPatternAsObject(pattern: string): Promise<{}> {
    try {
      const files = await fastGlob.sync(pattern, { deep: false, onlyFiles: true });

      const requiredFiles = {};
      files.map((filePath: any) => {
        let requiredFileContent: any = null;
        try {
          const requiredFile = require(filePath);
          const filename: string = filePath
            .split("/")
            .pop()
            .split(".ts")[0];
          requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;

          requiredFiles[filename] = requiredFileContent;
        } catch (err) {
          throw err;
        }
      });

      return requiredFiles;
    } catch (err) {
      throw err;
    }
  }
}
