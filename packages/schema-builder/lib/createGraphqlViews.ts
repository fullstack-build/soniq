import { ORM } from "@fullstack-one/db";
import { ILogger } from "@fullstack-one/logger";

export default async function createGraphqlViews(orm: ORM, logger: ILogger, graphqlViewSqlStatements: string[]): Promise<void> {
  const queryRunner = orm.createQueryRunner();

  try {
    logger.trace("migration.begin");
    await queryRunner.connect();
    await queryRunner.query("BEGIN");

    for (const statement of Object.values(graphqlViewSqlStatements)) {
      logger.trace("migration.view.sql.statement", statement);
      await queryRunner.query(statement);
    }

    logger.trace("migration.commit");
    await queryRunner.query("COMMIT");
  } catch (err) {
    logger.warn("migration.rollback");
    await queryRunner.query("ROLLBACK");
    throw err;
  }
  await queryRunner.release();
}
