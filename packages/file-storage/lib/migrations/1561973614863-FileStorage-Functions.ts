import { readFileSync, readdirSync } from "fs";
import { MigrationInterface, PostgresQueryRunner } from "@fullstack-one/db";

export class FileStorageFunctions1561973614863 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(loadAuthFunctionsSql());
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    // TODO: revert "CREATE FUNCTION" queries
  }
}

function loadAuthFunctionsSql(): string {
  const filenames = readdirSync(`${__dirname}/../../res/file-storage-functions-2`);
  return filenames
    .map((filename) => {
      return readFileSync(`${__dirname}/../../res/file-storage-functions-2/${String(filename)}`, { encoding: "utf-8" }).toString();
    })
    .join("\n\n");
}
