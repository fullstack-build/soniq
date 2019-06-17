import { readFileSync, readdirSync } from "fs";
import { MigrationInterface, PostgresQueryRunner } from "@fullstack-one/db";

export class InitialAuthFunctions1560267333653 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(loadAuthFunctionsSql());
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    const selectResult = await queryRunner.query(`
      SELECT 'DROP FUNCTION IF EXISTS ' || ns.nspname || '.' || proname || '(' || oidvectortypes(proargtypes) || ');'
      FROM pg_proc INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid)
      WHERE ns.nspname = '_auth'  order by proname;
    `);
    const dropFunctionStatements = selectResult.map((row) => row["?column?"]).join("\n");
    await queryRunner.query(dropFunctionStatements);
  }
}

function loadAuthFunctionsSql(): string {
  const filenames = readdirSync(`${__dirname}/1560267333653-auth-functions`);
  return filenames
    .map((filename) => {
      return readFileSync(`${__dirname}/1560267333653-auth-functions/${String(filename)}`, { encoding: "utf-8" }).toString();
    })
    .join("\n\n");
}
