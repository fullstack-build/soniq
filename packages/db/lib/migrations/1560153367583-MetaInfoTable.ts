import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaInfoTable1560153367583 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "_meta"."info" (
      key varchar NOT NULL,
      value varchar NOT NULL,
      CONSTRAINT info_pkey PRIMARY KEY (key)
    );`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE IF EXISTS "_meta"."info";`);
  }
}
