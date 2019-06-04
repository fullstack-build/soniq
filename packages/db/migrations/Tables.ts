import { MigrationInterface, QueryRunner } from "../";

export class Extensions implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``); // reverts things made in "up" method
  }
}
