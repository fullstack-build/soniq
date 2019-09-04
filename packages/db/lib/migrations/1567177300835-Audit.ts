import { MigrationInterface, QueryRunner } from "typeorm";

export class Audit1567177300835 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE _audit.row_change
      ADD COLUMN user_id uuid;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION _audit.audit()
        RETURNS trigger
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE NOT LEAKPROOF 
      AS $BODY$
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(OLD), row_to_json(NULL), current_role as user_role, _auth.current_user_id_or_null() as user_id;
          RETURN OLD;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(OLD), row_to_json(NEW), current_role as user_role, _auth.current_user_id_or_null() as user_id;
          RETURN NEW;
        ELSIF (TG_OP = 'INSERT') THEN
          INSERT INTO _audit.row_change SELECT now(), TG_OP::_audit.operation, TG_TABLE_SCHEMA, TG_TABLE_NAME, row_to_json(NULL), row_to_json(NEW), current_role as user_role, _auth.current_user_id_or_null() as user_id;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END
      $BODY$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      ALTER TABLE _audit.row_change
      DROP COLUMN user_id;
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
}
