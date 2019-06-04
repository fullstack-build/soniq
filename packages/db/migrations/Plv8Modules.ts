import { MigrationInterface, QueryRunner } from "../";

export class Plv8Modules implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS  _meta.plv8_js_modules (
        module text unique primary key,
        autoload bool default true,
        source text
    );`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``); // reverts things made in "up" method
  }
}
