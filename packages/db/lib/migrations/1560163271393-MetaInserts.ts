import { readFileSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaInserts1560163271393 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaInsertSql("info_version", "up"));
    await queryRunner.query(loadMetaInsertSql("plv8_rfc6902", "up"));
    await queryRunner.query(loadMetaInsertSql("plv8_validator", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaInsertSql("plv8_validator", "down"));
    await queryRunner.query(loadMetaInsertSql("plv8_rfc6902", "down"));
    await queryRunner.query(loadMetaInsertSql("info_version", "down"));
  }
}

function loadMetaInsertSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/1560163271393-meta-inserts/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
