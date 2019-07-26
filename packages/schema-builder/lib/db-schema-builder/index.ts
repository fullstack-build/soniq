import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { ORM } from "@fullstack-one/db";

@Service()
export class DbSchemaBuilder {
  private readonly logger: ILogger;

  constructor(@Inject((type) => LoggerFactory) loggerFactory: LoggerFactory, @Inject((type) => ORM) private readonly orm: ORM) {
    this.logger = loggerFactory.create(this.constructor.name);
  }

  public async createGraphqlViews(graphqlViewSqlStatements: string[]): Promise<void> {
    const queryRunner = this.orm.createQueryRunner();

    try {
      this.logger.trace("migration.begin");
      await queryRunner.connect();
      await queryRunner.query("BEGIN");

      for (const statement of Object.values(graphqlViewSqlStatements)) {
        this.logger.trace("migration.view.sql.statement", statement);
        await queryRunner.query(statement);
      }

      this.logger.trace("migration.commit");
      await queryRunner.query("COMMIT");
    } catch (err) {
      this.logger.warn("migration.rollback");
      await queryRunner.query("ROLLBACK");
      throw err;
    }
    await queryRunner.release();
  }
}
