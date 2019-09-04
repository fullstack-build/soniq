import { MigrationInterface, PostgresQueryRunner } from "@fullstack-one/db";

export class FileStorageTables1561973614862 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "_meta"."Files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now()),
        "extension" varchar NOT NULL,
        "type" varchar NOT NULL,
        "ownerUserId" uuid,
        "entityId" uuid,
        "verifiedAt" timestamp without time zone,
        "deletedAt" timestamp without time zone,
        PRIMARY KEY ("id"),
        UNIQUE ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "_meta"."FileColumns" (
        "id" uuid DEFAULT uuid_generate_v4(),
        "schemaName" varchar NOT NULL,
        "tableName" varchar NOT NULL,
        "columnName" varchar NOT NULL,
        "types" jsonb NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("schemaName", "tableName", "columnName")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "_meta"."FileSettings" (
        "key" varchar NOT NULL,
        "value" varchar,
        PRIMARY KEY ("key")
      );
      INSERT INTO "_meta"."FileSettings"("key","value")
      VALUES
      (E'max_temp_files_per_user',E'20')
      ON CONFLICT ON CONSTRAINT "FileSettings_pkey" DO NOTHING;
    `);
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.dropTable(`"_meta"."FileSettings"`, true);
    await queryRunner.dropTable(`"_meta"."FileColumns"`, true);
    await queryRunner.dropTable(`"_meta"."Files"`, true);
  }
}
