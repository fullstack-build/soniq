import { MigrationInterface } from "typeorm";
import { PostgresQueryRunner } from "typeorm/driver/postgres/PostgresQueryRunner";

export class Schema1560153165901 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.createSchema("_graphql", true);
    await queryRunner.createSchema("_versions", true);
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.dropSchema("_graphql", true);
    await queryRunner.dropSchema("_versions", true);
  }
}
