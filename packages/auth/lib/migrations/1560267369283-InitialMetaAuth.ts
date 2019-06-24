import { MigrationInterface, PostgresQueryRunner } from "@fullstack-one/db";

export class InitialMetaAuth1560267369283 implements MigrationInterface {
  public async up(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS _meta."Auth" (
          key character varying PRIMARY KEY,
          value character varying
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS "Auth_pkey" ON _meta."Auth"(key text_ops);
    `);
    await queryRunner.query(`
      INSERT INTO "_meta"."Auth"("key","value")
      VALUES
      (E'access_token_bf_iter_count',E'4'),
      (E'access_token_max_age_in_seconds',E'1209600'),
      (E'access_token_secret',E'geheim'),
      (E'admin_token_secret',E'boss'),
      (E'auth_factor_providers',E'password:email:facebook'),
      (E'get_tenant_by_user_id_query',E'SELECT ''DEFAULT'' "tenantId";'),
      (E'hash_bf_iter_count',E'6'),
      (E'hash_secret',E'gehtdichnixan'),
      (E'refresh_token_bf_iter_count',E'6'),
      (E'refresh_token_secret',E'ThisIsSparta'),
      (E'transaction_token_max_age_in_seconds',E'86400'),
      (E'transaction_token_secret',E'$2a$04$G6winEQvL4s7kTk8GJ9tq.w3.N3N6bQkm5KDQ.kmQvyMIfBqfh43q'),
      (E'transaction_token_timestamp',E'1554743124')
      ON CONFLICT (key) 
      DO NOTHING;
    `);
  }

  public async down(queryRunner: PostgresQueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE IF EXISTS _meta."Auth";`);
  }
}
