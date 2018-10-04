import * as fastGlob from "fast-glob";
import { readFile, writeFile } from "fs";
import { promisify } from "util";
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export abstract class AHelper {
  public static async loadFilesByGlobPattern(pattern: string) {
    try {
      const files = fastGlob.sync(pattern, {
        deep: false,
        onlyFiles: true
      });

      const readFilesPromises = [];
      files.map((filePath: any) => {
        readFilesPromises.push(readFileAsync(filePath, "utf8"));
      });

      return await Promise.all(readFilesPromises);
    } catch (err) {
      throw err;
    }
  }

  public static async requireFilesByGlobPattern(pattern: string) {
    try {
      const files = await fastGlob.sync(pattern, { deep: false, onlyFiles: true });

      const requiredFiles = [];
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

  public static async requireFilesByGlobPatternAsObject(pattern: string) {
    try {
      const files = await fastGlob.sync(pattern, { deep: false, onlyFiles: true });

      const requiredFiles = {};
      files.map((filePath: any) => {
        let requiredFileContent: any = null;
        try {
          const requiredFile = require(filePath);
          const name = filePath
            .split("/")
            .pop()
            .split(".ts")[0];
          requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;

          requiredFiles[name] = requiredFileContent;
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
