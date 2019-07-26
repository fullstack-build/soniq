import { MigrationInterface, QueryRunner } from "typeorm";

export class Audit1560165600721 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createSchema("_audit", true);
    await queryRunner.query(`CREATE TYPE _audit.operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');`);
    await queryRunner.query(`
      CREATE TABLE _audit.row_change
      (
        createdat timestamp without time zone NOT NULL DEFAULT now(),
        operation _audit.operation NOT NULL,
        table_schema character varying,
        table_name character varying,
        before_state jsonb,
        after_state jsonb,
        user_role character varying COLLATE pg_catalog."default"
      );
    `);
    await queryRunner.query(`
      CREATE TRIGGER nonupdatable_nondeletable_rows
        BEFORE UPDATE OR DELETE
        ON _audit.row_change
        FOR EACH ROW
        EXECUTE PROCEDURE _meta.make_table_immutable();
    `);
    await queryRunner.query(`
      CREATE FUNCTION _audit.audit()
        RETURNS trigger
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE NOT LEAKPROOF 
      AS $BODY$
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(OLD), row_to_json(NULL), current_role as user_role;
          RETURN OLD;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(OLD), row_to_json(NEW), current_role as user_role;
          RETURN NEW;
        ELSIF (TG_OP = 'INSERT') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(NULL), row_to_json(NEW), current_role as user_role;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END
      $BODY$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("DROP FUNCTION _audit.audit();");
    await queryRunner.query(`DROP TYPE IF EXISTS _audit.operation;`);
    await queryRunner.query(`DROP TABLE IF EXISTS _audit.row_change;`);
    await queryRunner.dropSchema("_audit", true);
  }
}
