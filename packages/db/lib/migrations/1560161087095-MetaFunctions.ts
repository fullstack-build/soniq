import { readFileSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaFunctions1560161087095 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaFunctionSql("get_last_generated_uuid", "up"));
    await queryRunner.query(loadMetaFunctionSql("jsonb_merge", "up"));
    await queryRunner.query(loadMetaFunctionSql("make_table_immutable", "up"));
    await queryRunner.query(loadMetaFunctionSql("plv8_require", "up"));
    await queryRunner.query(loadMetaFunctionSql("sanitize", "up"));
    await queryRunner.query(loadMetaFunctionSql("strip_all_triggers", "up"));
    await queryRunner.query(loadMetaFunctionSql("triggerUpdateOrCreate", "up"));
    await queryRunner.query(loadMetaFunctionSql("uuid_generate_v4", "up"));
    await queryRunner.query(loadMetaFunctionSql("validate", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaFunctionSql("validate", "down"));
    await queryRunner.query(loadMetaFunctionSql("uuid_generate_v4", "down"));
    await queryRunner.query(loadMetaFunctionSql("triggerUpdateOrCreate", "down"));
    await queryRunner.query(loadMetaFunctionSql("strip_all_triggers", "down"));
    await queryRunner.query(loadMetaFunctionSql("sanitize", "down"));
    await queryRunner.query(loadMetaFunctionSql("plv8_require", "down"));
    await queryRunner.query(loadMetaFunctionSql("make_table_immutable", "down"));
    await queryRunner.query(loadMetaFunctionSql("jsonb_merge", "down"));
    await queryRunner.query(loadMetaFunctionSql("get_last_generated_uuid", "down"));
  }
}

function loadMetaFunctionSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/../../res/1560161087095-meta-functions/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
