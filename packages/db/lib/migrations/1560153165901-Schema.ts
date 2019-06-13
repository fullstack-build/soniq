import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1560153165901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS _meta;`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS _versions;`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS _versions`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS _meta`);
  }
}
