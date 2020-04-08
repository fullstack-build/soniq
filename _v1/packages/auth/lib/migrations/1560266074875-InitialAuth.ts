import { readFileSync } from "fs";
import { MigrationInterface, PostgresQueryRunner } from "@fullstack-one/db";

export class InitialAuth1560266074875 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(loadAuthSchemaAndTablesSql("auth.schema", "up"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("UserAuthentication.table", "up"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("AuthFactor.table", "up"));
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(loadAuthSchemaAndTablesSql("AuthFactor.table", "down"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("UserAuthentication.table", "down"));
    await queryRunner.query(loadAuthSchemaAndTablesSql("auth.schema", "down"));
  }
}

function loadAuthSchemaAndTablesSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/../../res/1560266074875-auth-schema-and-tables/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
