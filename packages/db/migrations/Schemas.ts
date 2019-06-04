import { MigrationInterface, QueryRunner } from "../";

export class Schemas implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS _meta;`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``); // reverts things made in "up" method
  }
}
