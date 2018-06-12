import * as deepmerge from 'deepmerge';

import { Service, Inject } from '@fullstack-one/di';
import { IDbMeta, IDbRelation } from '../IDbMeta';
import { DbAppClient } from '@fullstack-one/db';

// extended parser
import { getQueryParser } from './queryParser';
export { registerQueryParser } from './queryParser';

import { getTriggerParser } from './triggerParser';
export { registerTriggerParser } from './triggerParser';

// https://www.alberton.info/postgresql_meta_info.html
@Service()
export class PgToDbMeta {

  private readonly DELETED_PREFIX = '_deleted:';
  private readonly KNOWN_TYPES    = ['uuid', 'varchar', 'int4', 'float8', 'bool', 'json', 'jsonb', 'relation'];

  private dbAppClient: DbAppClient;

  private readonly dbMeta: IDbMeta = {
    version: 1.0,
    schemas: {},
    enums: {},
    relations: {}
  };

  constructor(@Inject(type => DbAppClient) dbAppClient?) {
    this.dbAppClient = dbAppClient;
  }

  public async getPgDbMeta(): Promise<IDbMeta> {
    try {
      // start with schemas
      await this.iterateAndAddSchemas();

      // run extensions parser
      if (getQueryParser() != null) {
        const parserPromises = [];
        Object.values(getQueryParser()).forEach(async (parser: (dbClient: DbAppClient, dbMeta: IDbMeta) => void) => {
          parserPromises.push(parser(this.dbAppClient, this.dbMeta));
        });
        // await all parsers to finish their jobs
        await Promise.all(parserPromises);
      }

      // return copy instead of ref
      return deepmerge({}, this.dbMeta);
    } catch (err) {
      throw err;
    }
  }

  // PRIVATE METHODS
  private async iterateAndAddSchemas(): Promise<void> {

    try {
      const { rows } = await this.dbAppClient.pgClient.query(
        `SELECT
          schema_name
        FROM
          information_schema.schemata
        WHERE
            schema_name <> '_meta'
          AND
            schema_name <> 'information_schema'
          AND
          schema_name NOT LIKE 'pg_%';`
      );
      // iterate all tables
      for (const rowTemp of Object.values(rows)) {
        const row: any = rowTemp;
        const schemaName = row.schema_name;

        // ignore deleted schemas
        if (schemaName.indexOf(this.DELETED_PREFIX) !== 0) {
          // add schema objects for each schema
          this.dbMeta.schemas[schemaName] = {
            name: schemaName,
            tables: {},
            views: []
          };

          // iterate enum types
          await this.iterateEnumTypes(schemaName);
          // iterate tables
          await this.iterateAndAddTables(schemaName);
        }
      }

    } catch (err) {
      throw err;
    }

  }

  private async iterateEnumTypes(schemaName): Promise<void> {
    // iterate ENUM Types with columns its used in
    const { rows } =  await this.dbAppClient.pgClient.query(
      `SELECT
                          n.nspname as enum_schema,
                          t.typname as enum_name,
                          array_to_json(array_agg(e.enumlabel)) as enum_values,
                          array_to_json(array_agg(e.enumlabel ORDER BY e.enumsortorder ASC)) as enum_values,
                          c.table_schema as used_schema,
                          c.table_name as used_table,
                          c.column_name as used_column,
                          v.table_name IS NOT NULL as is_view
                        FROM
                          pg_type t
                        JOIN
                          pg_enum e on t.oid = e.enumtypid
                        JOIN
                          pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                        FULL JOIN
                         information_schema.columns c ON c.udt_name = t.typname
                        FULL JOIN
                          information_schema.views v ON 
                          (v.table_catalog = c.table_catalog AND v.table_schema = c.table_schema AND v.table_name = c.table_name)
                        WHERE
                          n.nspname = $1
                        GROUP BY
                          n.nspname, t.typname, c.table_schema, c.table_name, c.column_name, v.table_name;`, [schemaName]);

    // iterate all tables
    for (const rowTemp of Object.values(rows)) {
      const row: any = rowTemp;
      const enumName = row.enum_name;

      // reuse existing enum (for multiple columns using same enum)
      const thisEnums = this.dbMeta.enums[enumName] = this.dbMeta.enums[enumName] || {
        name: enumName,
        values: row.enum_values,
        columns: {}
      };
      // not for view
      if (!row.is_view) {
        // add column to enum if used
        if (row.used_schema != null && row.used_table != null && row.used_column != null) {
          const enumColumnName = `${row.used_schema}.${row.used_table}.${row.used_column}`;
          thisEnums.columns[enumColumnName] = {
            schemaName: row.used_schema,
            tableName:  row.used_table,
            columnName: row.used_column
          };
        }
      }
    }
  }

  private async iterateAndAddTables(schemaName): Promise<void> {

    try {
      const { rows } = await this.dbAppClient.pgClient.query(
        `SELECT
            table_name
        FROM
          information_schema.tables
        WHERE
          table_schema ='${schemaName}' AND table_type='BASE TABLE';`
      );
      // iterate all tables
      for (const rowTemp of Object.values(rows)) {
        const row: any = rowTemp;
        const tableName = row.table_name;

        // add new table object
        this.dbMeta.schemas[schemaName].tables[tableName] = {
          name: tableName,
          schemaName,
          description: null,
          constraints: {},
          columns: {},
          extensions: {}
        };

      }

      // iterate tables and add columns - relates on tables existing
      for (const tableName of Object.keys(this.dbMeta.schemas[schemaName].tables)) {
        // add columns to table
        await this.iterateAndAddColumns(schemaName, tableName);
      }

      // iterate tables and add constraints - relates on tables and columns existing
      for (const tableName of Object.keys(this.dbMeta.schemas[schemaName].tables)) {
        // add constraints to table
        await this.iterateAndAddConstraints(schemaName, tableName);
      }

      // iterate and add triggers
      for (const tableName of Object.keys(this.dbMeta.schemas[schemaName].tables)) {
        // add triggers to table
        await this.iterateAndAddTriggers(schemaName, tableName);
      }

    } catch (err) {
      throw err;
    }

  }

  private async iterateAndAddColumns(schemaName, tableName): Promise<void> {

    // keep reference to current table
    const currentTable = this.dbMeta.schemas[schemaName].tables[tableName];

    try {

      const { rows } = await this.dbAppClient.pgClient.query(
        `SELECT
        c.column_name AS column_name,
        c.column_default AS column_default,
        c.is_nullable AS is_nullable,
        c.data_type AS data_type,
        c.udt_name AS udt_name,
        c.character_maximum_length AS character_maximum_length,
        pgd.description AS comment
      FROM
        information_schema.columns c
      LEFT JOIN
	      pg_catalog.pg_description pgd
	    ON
	      pgd.objsubid = c.ordinal_position
      WHERE
        table_schema = $1
        AND
        table_name = $2
      ORDER BY
        ordinal_position ASC;`,[schemaName, tableName]
      );

      // iterate all columns
      for (const columnRow of Object.values(rows)) {
        const column: any = columnRow;

        // check if it is a known type and assume customType otherwise
        let type = column.udt_name;
        let customType;
        if (!this.KNOWN_TYPES.includes(type)) {
          customType = type;
          type = 'customType';
        }

        // add new column and keep reference for later
        const columnName = column.column_name;
        const newColumn: any = {
          name: columnName,
          description: null,
          type,
          customType,
          extensions: {}
        };

        // add new column to dbMeta if its not marked as deleted
        if (columnName.indexOf(this.DELETED_PREFIX) !== 0) {
          currentTable.columns[columnName] = newColumn;
        } else {
          continue;
        }

        // default value
        if (column.column_default !== null) {
          const isExpression = (column.column_default.indexOf('::') === -1);
          const value = (isExpression) ? column.column_default : column.column_default.split('::')[0].replace(/'/g,'');
          newColumn.defaultValue = {
            isExpression,
            value
          };
        }

        // add NOT NULLABLE constraint
        if (column.is_nullable === 'NO') {
          this.addConstraint('NOT NULL', { column_name: column.column_name }, currentTable);
        }

        // custom type
        if (column.data_type === 'USER-DEFINED') {
          // check if it is a known enum
          newColumn.type = (this.dbMeta.enums[newColumn.customType] != null) ? 'enum' : 'customType';
        } else if (column.data_type === 'ARRAY' && column.udt_name === '_uuid') { // Array of _uuid is most certainly an n:m relation

          // set column type to uuid[]
          newColumn.type = 'uuid[]';
          delete  newColumn.customType;

          // many to many arrays should have JSON description - check for that
          try {
            const mtmRelationPayload = JSON.parse(column.comment);

            // check if referenced table exists
            if (mtmRelationPayload.reference != null &&
              mtmRelationPayload.reference.tableName != null &&
              this.dbMeta.schemas[mtmRelationPayload.reference.schemaName].tables[mtmRelationPayload.reference.tableName] != null) {
              // add one side m:n
              this.manyToManyRelationBuilderHelper(column, schemaName, tableName, mtmRelationPayload);
            }
          } catch (err) {
            process.stderr.write(
              'PgToDbMeta.error.mtmrelation.payload.parsing.error: ' + err + '\n',
            );
          }
        }
      }

    } catch (err) {
      throw err;
    }
  }

  private async iterateAndAddConstraints(schemaName, tableName): Promise<void> {

    // keep reference to current table
    const currentTable = this.dbMeta.schemas[schemaName].tables[tableName];

    // iterate other constraints
    const { rows } = await this.dbAppClient.pgClient.query(
      `SELECT
        tc.constraint_type    AS constraint_type,
        tc.constraint_name    AS constraint_name,
        tc.table_schema       AS schema_name,
        tc.table_name         AS table_name,
        kcu.column_name       AS column_name,
        ccu.table_schema      AS references_schema_name,
        ccu.table_name        AS references_table_name,
        ccu.column_name       AS references_column_name,
        rc.update_rule        AS on_update,
        rc.delete_rule        AS on_delete,
        pgc.consrc            AS check_code,
      obj_description(pgc.oid, 'pg_constraint') AS comment
       FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
         ON tc.constraint_catalog = kcu.constraint_catalog
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.referential_constraints rc
         ON tc.constraint_catalog = rc.constraint_catalog
        AND tc.constraint_schema = rc.constraint_schema
        AND tc.constraint_name = rc.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
         ON rc.unique_constraint_catalog = ccu.constraint_catalog
        AND rc.unique_constraint_schema = ccu.constraint_schema
        AND rc.unique_constraint_name = ccu.constraint_name
  LEFT JOIN pg_catalog.pg_constraint pgc
       ON pgc.conname = tc.constraint_name
      WHERE tc.table_schema = $1 AND tc.table_name = $2;`, [schemaName, tableName]
    );

    // other constraints
    Object.values(rows).forEach((constraint: any) => {
      if (constraint.constraint_type === 'FOREIGN KEY') { // relations
        this.relationBuilderHelper(constraint);
      } else if (constraint.constraint_type === 'CHECK') { // checks
        this.addCheck(constraint, currentTable);
      } else { // other constraints
        this.addConstraint(constraint.constraint_type, constraint, currentTable);
      }

    });

  }

  private addConstraint(constraintType,
                        constraintRow,
                        refDbMetaCurrentTable): void {

    let constraintName  = constraintRow.constraint_name;
    const columnName = constraintRow.column_name;
    // ignore constraint if no column name is set
    if (columnName == null) {
      return;
    }

    // add constraint name for not_nullable
    if (constraintType === 'NOT NULL') {
      constraintName = `${refDbMetaCurrentTable.name}_${columnName}_not_null`;
    }

    // add new constraint if name was set
    if (constraintName != null) {
      const constraint = refDbMetaCurrentTable.constraints[constraintName] = refDbMetaCurrentTable.constraints[constraintName] || {
        type: constraintType,
        options: {},
        columns: []
      };
      // add column name to constraint - once
      if (constraint.columns.indexOf(columnName) === -1) {
        constraint.columns.push(columnName);
      }
    }

    // add constraint name to field
    const currentColumnRef = refDbMetaCurrentTable.columns[columnName];

    currentColumnRef.constraintNames = currentColumnRef.constraintNames || [];
    currentColumnRef.constraintNames.push(constraintName);
    // keep them sorted for better comparison of objects
    currentColumnRef.constraintNames.sort();

  }

  private addCheck(constraintRow, refDbMetaCurrentTable): void {
    const constraintName = constraintRow.constraint_name;
    const checkCode = constraintRow.check_code;
    // ignore and other constraints without code
    if (checkCode == null) {
      return;
    }

    // add new constraint if name was set
    if (constraintName != null) {
      refDbMetaCurrentTable.constraints[constraintName] = refDbMetaCurrentTable.constraints[constraintName] || {
        type: 'CHECK',
        options: {
          param1: checkCode
        }
      };

    }

    // add constraint name to field
    /* const currentColumnRef = refDbMetaCurrentTable.columns[columnName];
		currentColumnRef.constraintNames.push(constraintName);*/
  }

  private async iterateAndAddTriggers(schemaName, tableName): Promise<void> {

    // keep reference to current table
    const currentTable = this.dbMeta.schemas[schemaName].tables[tableName];

    // load triggers for table
    const { rows } = await this.dbAppClient.pgClient.query(
      `SELECT DISTINCT
                    trigger_name,
                    event_object_schema,
                    event_object_table,
                    action_statement
                 FROM  information_schema.triggers
                 WHERE
                     event_object_schema = $1
                     AND
                     event_object_table = $2;`, [schemaName, tableName]
    );

    // TRIGGER EXTENSIONS
    Object.values(rows).forEach((trigger: any) => {
      // execute all registered trigger parser for each trigger
      Object.values(getTriggerParser()).forEach((triggerParser: (trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => void) => {
        triggerParser(trigger, this.dbMeta, schemaName, tableName);
      });
    });

  }

  private relationBuilderHelper(constraint) {

    let relationPayloadOne: any = {};
    let relationPayloadMany: any = {};
    try {
      const relationPayload = Object.values(JSON.parse(constraint.comment));
      relationPayloadOne = relationPayload.find((relation: any) => {
        return (relation.type === 'ONE');
      });
      relationPayloadMany = relationPayload.find((relation: any) => {
        return (relation.type === 'MANY');
      });

    } catch (err) {
      // ignore empty payload -> fallback in code below
      process.stderr.write(
        'PgToDbMeta.error.relation.payload.parsing.error: ' + err + '\n',
      );
    }

    const constraintName = relationPayloadOne.name || relationPayloadMany.name || constraint.constraint_name.replace('fk_', '');

    const onUpdate = (constraint.on_update !== 'NO ACTION') ? constraint.on_update : null;
    const onDelete = (constraint.on_delete !== 'NO ACTION') ? constraint.on_delete : null;

    // add relation: one
    const relationOne: IDbRelation = {
      name: constraintName,
      type: 'ONE',
      schemaName: constraint.schema_name,
      tableName: constraint.table_name,
      columnName: constraint.column_name,
      virtualColumnName: relationPayloadOne && relationPayloadOne.virtualColumnName,
      onUpdate,
      onDelete,
      // Name of the association
      description: null,
      // joins to
      reference: {
        schemaName: constraint.references_schema_name,
        tableName: constraint.references_table_name,
        columnName: constraint.references_column_name
      }
    };

    // add relation: many
    const relationMany: IDbRelation = {
      name: constraintName,
      type: 'MANY',
      schemaName: constraint.references_schema_name,
      tableName: constraint.references_table_name,
      columnName: null,
      virtualColumnName: relationPayloadMany && relationPayloadMany.virtualColumnName,
      onUpdate: null,
      onDelete: null,
      // Name of the association
      description: null,
      // joins to
      reference: {
        schemaName: constraint.schema_name,
        tableName: constraint.table_name,
        columnName: null
      }
    };

    // relations names
    const relationOneName = `${relationOne.schemaName}.${relationOne.tableName}`;
    const relationManyName = `${relationMany.schemaName}.${relationMany.tableName}`;

    // add relation to dbMeta
    this.dbMeta.relations[constraintName] = {
      [relationOneName]: relationOne,
      [relationManyName]: relationMany
    };

  }

  private manyToManyRelationBuilderHelper(columnDescribingRelation, schemaName, tableName, mtmPayload) {

    const relationName = mtmPayload.name;

    // add relation: one
    const newRelation: IDbRelation = {
      name: relationName,
      type: 'MANY',
      schemaName,
      tableName,
      columnName: columnDescribingRelation.column_name,
      virtualColumnName: mtmPayload && mtmPayload.virtualColumnName,
      onUpdate: null,
      onDelete: null,
      // Name of the association
      description: null,
      // joins to
      reference: {
        schemaName: mtmPayload.reference.schemaName,
        tableName: mtmPayload.reference.tableName,
        columnName: mtmPayload.reference.columnName
      }
    };

    // relations names
    const relationSideName = `${newRelation.schemaName}.${newRelation.tableName}`;

    // add relation object if not available
    this.dbMeta.relations[mtmPayload.name] = this.dbMeta.relations[mtmPayload.name] || {};
    this.dbMeta.relations[mtmPayload.name][relationSideName] = newRelation;

  }

}
