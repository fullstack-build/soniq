import { MigrationInterface, QueryRunner } from "../";

export class Tables implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``); // reverts things made in "up" method
  }
}
