import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaPlv8JsModulesTable1560160652405 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS  "_meta"."plv8_js_modules" (
      module text unique primary key,
      autoload bool default true,
      source text
    );`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE IF EXISTS "_meta"."plv8_js_modules";`);
  }
}
