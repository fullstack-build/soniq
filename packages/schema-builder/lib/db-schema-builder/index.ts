import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { DbAppClient } from "@fullstack-one/db";

@Service()
export class DbSchemaBuilder {
  private dbAppClient: DbAppClient;
  private readonly logger: ILogger;
  private readonly graphqlViewSqlStatements: string[] = [];

  constructor(@Inject((type) => LoggerFactory) loggerFactory: LoggerFactory, @Inject((type) => DbAppClient) dbAppClient: DbAppClient) {
    this.dbAppClient = dbAppClient;
    this.logger = loggerFactory.create(this.constructor.name);
  }

  public addGraphqlViewSqlStatements(statements: string[]): void {
    statements.forEach((statement) => this.graphqlViewSqlStatements.push(statement));
  }

  public async migrate(): Promise<void> {
    const dbClient = this.dbAppClient.pgClient;

    try {
      this.logger.trace("migration.begin");
      await dbClient.query("BEGIN");

      for (const statement of Object.values(this.graphqlViewSqlStatements)) {
        this.logger.trace("migration.view.sql.statement", statement);
        await dbClient.query(statement);
      }

      this.logger.trace("migration.commit");
      await dbClient.query("COMMIT");
    } catch (err) {
      this.logger.warn("migration.rollback");
      await dbClient.query("ROLLBACK");
      throw err;
    }
  }
}
