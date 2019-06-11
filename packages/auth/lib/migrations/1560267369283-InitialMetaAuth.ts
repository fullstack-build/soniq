import { MigrationInterface, QueryRunner } from "@fullstack-one/db";
import { readFileSync } from "fs";

export class InitialMetaAuth1560267369283 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    // queryRunner.query(loadMetaAuthSql("auth.schema", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // queryRunner.query(loadMetaAuthSql("auth.schema", "down"));
  }
}

function loadMetaAuthSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/1560267369283-meta-auth/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
