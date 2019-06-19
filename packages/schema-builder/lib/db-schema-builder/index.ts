import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { ORM } from "@fullstack-one/db";

@Service()
export class DbSchemaBuilder {
  private readonly logger: ILogger;
  private readonly graphqlViewSqlStatements: string[] = [];

  constructor(@Inject((type) => LoggerFactory) loggerFactory: LoggerFactory, @Inject((type) => ORM) private readonly orm: ORM) {
    this.logger = loggerFactory.create(this.constructor.name);
  }

  public addGraphqlViewSqlStatements(statements: string[]): void {
    statements.forEach((statement) => this.graphqlViewSqlStatements.push(statement));
  }

  public async migrate(): Promise<void> {
    const queryRunner = this.orm.createQueryRunner();

    try {
      this.logger.trace("migration.begin");
      await queryRunner.connect();
      await queryRunner.query("BEGIN");

<<<<<<< HEAD
      for (const statement of Object.values(this.graphqlViewSqlStatements)) {
        this.logger.trace("migration.view.sql.statement", statement);
        await queryRunner.query(statement);
=======
    return bootSql;
  }

  public async migrate(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop: boolean = true): Promise<void> {
    // get DB pgClient from DI container
    const dbClient = this.dbAppClient.pgClient;

    // init DB
    await this.initDb();

    // get migration statements
    const migrationSqlStatements = this.getMigrationSqlStatements(fromDbMeta, toDbMeta, renameInsteadOfDrop);

    // get previous migration and compare to current
    const previousMigrationRow: any = (await dbClient.query("SELECT state FROM _meta.migrations ORDER BY created_at DESC LIMIT 1;")).rows[0];
    const previousMigrationStateJSON = previousMigrationRow == null ? {} : previousMigrationRow.state;

    // Migrate if any statements where generated (e.g. DB was changed but not DBMeta) OR any changes occurred to DBMeta
    if (migrationSqlStatements.length > 0 || diff(previousMigrationStateJSON, toDbMeta) != null) {
      // get view statements
      const viewsSqlStatements = this.getViewsSql();

      // run DB migrations
      try {
        // create transaction
        this.logger.trace("migration.begin");
        await dbClient.query("BEGIN");

        // run migration sql
        for (const sql of Object.values(migrationSqlStatements)) {
          this.logger.trace("migration.sql.statement", sql);
          await dbClient.query(sql);
        }

        // create views based on DB
        for (const sql of Object.values(viewsSqlStatements)) {
          // todo: check why a cast is necessary
          const thisSql: any = sql;
          this.logger.trace("migration.view.sql.statement", thisSql);
          await dbClient.query(thisSql);
        }

        // current framework db version
        const dbVersion: string = (await dbClient.query("SELECT value FROM _meta.info WHERE key = 'version';")).rows[0].value;

        // last step, save final dbMeta in _meta
        this.logger.trace("migration.state.saved");
        await dbClient.query('INSERT INTO "_meta"."migrations"(version, state) VALUES($1,$2)', [dbVersion, toDbMeta]);

        // commit
        this.logger.trace("migration.commit");
        await dbClient.query("COMMIT");
      } catch (err) {
        // rollback
        this.logger.warn("migration.rollback");
        await dbClient.query("ROLLBACK");
        throw err;
>>>>>>> master
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
