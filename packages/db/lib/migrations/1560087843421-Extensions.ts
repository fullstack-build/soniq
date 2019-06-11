import { MigrationInterface, QueryRunner } from "typeorm";

export class Extensions1560087843421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "plv8";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "plv8";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
  }
}
