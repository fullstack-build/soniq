import { MigrationInterface, QueryRunner } from "typeorm";

export class SetPlv8StartProc1560162945204 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("SET plv8.start_proc = '_meta.plv8_require';");
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("RESET plv8.start_proc;");
  }
}
