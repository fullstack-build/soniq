import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaMigrationsTable1560153367683 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "_meta"."migrations" (
      "id" serial,
      "created_at" timestamp DEFAULT now(),
      "version" varchar,
      "state" jsonb,
      PRIMARY KEY ("id")
    );`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE IF EXISTS "_meta"."migrations";`);
  }
}
