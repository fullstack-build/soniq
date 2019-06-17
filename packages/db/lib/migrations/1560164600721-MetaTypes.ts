import { readFileSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class MetaTypes1560164600721 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaTypesSql("locale", "up"));
    await queryRunner.query(loadMetaTypesSql("versioning_action", "up"));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(loadMetaTypesSql("versioning_action", "down"));
    await queryRunner.query(loadMetaTypesSql("locale", "down"));
  }
}

function loadMetaTypesSql(filename: string, direction: "up" | "down"): string {
  return readFileSync(`${__dirname}/../../res/1560164600721-meta-types/${filename}.${direction}.sql`, { encoding: "utf-8" }).toString();
}
