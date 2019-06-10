import { MigrationInterface, QueryRunner } from "typeorm";

// Does need superuser access. TODO: how to migrate with _aiven? What is this class for?

// export class OperatorClassUuidOps1560165051719 implements MigrationInterface {
//   public async up(queryRunner: QueryRunner): Promise<any> {
//     queryRunner.query(`CREATE OPERATOR CLASS _uuid_ops DEFAULT FOR TYPE _uuid USING gin AS
//             OPERATOR 1 &&(anyarray, anyarray),
//             OPERATOR 2 @>(anyarray, anyarray),
//             OPERATOR 3 <@(anyarray, anyarray),
//             OPERATOR 4 =(anyarray, anyarray),
//             FUNCTION 1 uuid_cmp(uuid, uuid),
//             FUNCTION 2 ginarrayextract(anyarray, internal, internal),
//             FUNCTION 3 ginqueryarrayextract(anyarray, internal, smallint, internal, internal, internal, internal),
//             FUNCTION 4 ginarrayconsistent(internal, smallint, anyarray, integer, internal, internal, internal, internal),
//             STORAGE uuid;
//         `);
//   }

//   public async down(queryRunner: QueryRunner): Promise<any> {
//     queryRunner.query(`DROP OPERATOR CLASS IF EXISTS _uuid_ops;`);
//   }
// }
