import { MigrationInterface, QueryRunner } from "@fullstack-one/db";
import { readFileSync } from "fs";

export class InitialAuth1560266074875 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadAuthSchemaAndTablesSql("auth.schema", "up"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("UserAuthentication.table", "up"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("AuthFactor.table", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadAuthSchemaAndTablesSql("AuthFactor.table", "down"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("UserAuthentication.table", "down"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("auth.schema", "down"));
  }
}

function loadAuthSchemaAndTablesSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/1560266074875-auth-schema-and-tables/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
