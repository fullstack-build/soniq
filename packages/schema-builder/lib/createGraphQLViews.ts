import { ORM } from "@fullstack-one/db";
import { Logger } from "@fullstack-one/logger";

export default async function createGraphQLViews(orm: ORM, logger: Logger, graphqlViewSqlStatements: string[]): Promise<void> {
  const queryRunner = orm.createQueryRunner();

  try {
    logger.debug("migration.begin");
    await queryRunner.connect();
    await queryRunner.query("BEGIN");

    for (const statement of Object.values(graphqlViewSqlStatements)) {
      logger.debug("migration.view.sql.statement", statement);
      await queryRunner.query(statement);
    }

    logger.debug("migration.commit");
    await queryRunner.query("COMMIT");
  } catch (err) {
    logger.warn("migration.rollback");
    await queryRunner.query("ROLLBACK");
    throw err;
  }
  await queryRunner.release();
}
