import { MigrationInterface, QueryRunner } from "@fullstack-one/db";
import { readFileSync } from "fs";

export class InitialAuthFunctions1560267333653 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    // queryRunner.query(loadAuthFunctionSql("auth.schema", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // queryRunner.query(loadAuthFunctionSql("auth.schema", "down"));
  }
}

function loadAuthFunctionSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/1560267333653-auth-functions/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
