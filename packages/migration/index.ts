import * as FullstackOne from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';
import { pgToDbObject } from '../db/pgToDbObject';

const DELETED_PREFIX = '_deleted:';

export namespace migration {
  let createDrop = false;

  export async function createMigration(pCreateDrop: boolean = false) {
    const $one = FullstackOne.getInstance();
    createDrop = pCreateDrop;

    try {
      // write parsed schema into migrations folder
      /*await graphQlHelper.writeTableObjectIntoMigrationsFolder(
        `${this.ENVIRONMENT.path}/migrations/`,
        tableObjects,
        optionalMigrationId,
      );
      // emit event
      this.emit('schema.dbObject.migration.saved');*/

      // tslint:disable-next-line:no-console
      // console.log(JSON.stringify($one.getDbObject(), null, 2));

      // tslint:disable-next-line:no-console
      console.log('############### dbObjectFromPG:');
      const dbObjectFromPg = await pgToDbObject($one);
      // tslint:disable-next-line:no-console
      // console.log(JSON.stringify(dbObjectFromPg, null, 2));

      const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      // tslint:disable-next-line:no-console
      console.log('############### UP:');
      // tslint:disable-next-line:no-console
      console.log(sqlStatements.up.join('\n'));
      // tslint:disable-next-line:no-console
      console.log('############### DOWN:');
      // copy, so we can reverse it without destroying original
      const downMigrations = sqlStatements.down.slice(0);
      // tslint:disable-next-line:no-console
      console.log(downMigrations.reverse().join('\n'));

      // tslint:disable-next-line:no-console
      console.log('############### DELTA:');
      // tslint:disable-next-line:no-console
      console.log(createDeltaSQLFromTwoDbObjects(dbObjectFromPg, $one.getDbObject()).join('\n'));

      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

      const viewSqlStatements = createViewsFromDbObject($one.getDbObject(), 'appuserhugo', false);
      // tslint:disable-next-line:no-console
      console.log(viewSqlStatements.join('\n'));

      // display result sql in terminal
      // this.logger.debug(sqlStatements.join('\n'));
    } catch (err) {

      // tslint:disable-next-line:no-console
      console.log('err', err);
      // this.logger.warn('loadFilesByGlobPattern error', err);
      // emit event
      // this.emit('schema.load.error');
    }
  }

  export function createDeltaSQLFromTwoDbObjects(dbObjectOld: FullstackOne.IDbObject, dbObjectNew: FullstackOne.IDbObject) {
    const migrationOld = createSqlFromDbObject(dbObjectOld);
    const migrationNew = createSqlFromDbObject(dbObjectNew);

    let deltaSqlCommands = [];

    // find all that are in old but not in new -> run down
    const deltaInOldNotInNew = Object.entries(migrationOld.up).filter((entry) => {
      return (!migrationNew.up.includes(entry[1]));
    });

    // collect down migrations
    deltaSqlCommands.push('-- DOWN');
    const downMigrations = [];
    Object.values(deltaInOldNotInNew).forEach((delta) => {
      const deltaIndex = delta[0];
      const downMigration = migrationOld.down[deltaIndex];
      downMigrations.push(downMigration);
    });

    // run down migrations reversed
    downMigrations.reverse();
    deltaSqlCommands = deltaSqlCommands.concat(downMigrations);

    // find all that are in new but not in old -> ups
    const deltaInNewNotInOld = Object.entries(migrationNew.up).filter((entry) => {
      return (!migrationOld.up.includes(entry[1]));
    });

    // collect down migrations
    deltaSqlCommands.push('-- UP');
    Object.values(deltaInNewNotInOld).forEach((delta) => {
      const deltaIndex = delta[0];
      const upMigration = migrationNew.up[deltaIndex];
      deltaSqlCommands.push(upMigration);
    });

    // remove unnecessary commands for renamed columns, tables and schemas
    let filteredDeltaSqlCommands = [...deltaSqlCommands];
    deltaSqlCommands.forEach((statement) => {
      // column
      if (
        statement.indexOf('ALTER TABLE') !== -1 &&
        statement.indexOf('RENAME COLUMN TO') !== -1 &&
        statement.indexOf(DELETED_PREFIX) === -1) {
        // tslint:disable-next-line:no-console
        console.error('## COLUMN');

        const myRegexp = /ALTER TABLE .* RENAME COLUMN "(.*)" TO "(.*)"+/g;
        const match = myRegexp.exec(statement);
        const oldName = match[1];
        const newName = match[2];

        if (oldName != null && newName != null) {
          filteredDeltaSqlCommands = deltaSqlCommands.filter((subStatement) => {
            return (
              subStatement.indexOf(`ADD COLUMN "${newName}"`) === -1
              &&
              subStatement.indexOf(`ALTER COLUMN "${oldName}" TYPE varchar`) === -1
              &&
              subStatement.indexOf(`RENAME COLUMN "${oldName}" TO "${DELETED_PREFIX}${oldName}"`) === -1
              &&
              subStatement.indexOf(`DROP COLUMN IF EXISTS "${oldName}"`) === -1
            );
          });

          // check if anything was removed, if not => remove rename colums -> done already
          if (deltaSqlCommands.length === filteredDeltaSqlCommands.length) {
            filteredDeltaSqlCommands = filteredDeltaSqlCommands.filter(e => e !== statement);
          }

        }
      } else if (
        statement.indexOf('ALTER TABLE') !== -1 &&
        statement.indexOf('RENAME TO') !== -1 &&
        statement.indexOf(DELETED_PREFIX) === -1) { // table

        const myRegexp = /ALTER TABLE "(.*)" RENAME TO "(.*)"+/g;
        const match = myRegexp.exec(statement);
        const oldName = `"${match[1]}"`;
        const newName = match[2];
        // tslint:disable-next-line:no-console
        console.error('## TABLE', oldName, newName);

      }
    });

    return filteredDeltaSqlCommands;
  }

  export function createSqlFromDbObject(
    dbObject: FullstackOne.IDbObject,
  ): {up: string[], down: string[]} {
    const sqlCommands: {up: string[], down: string[]} = {
      up: [],
      down: []
    };

    // iterate over enums
    Object.entries(dbObject.enums).map((enumTypeArray) => {
      createSqlForEnumObject(sqlCommands, enumTypeArray[0], enumTypeArray[1]);
    });

    // iterate over database schemas
    Object.entries(dbObject.schemas).map((schemaEntry) => {
      createSqlFromSchemaObject(sqlCommands, schemaEntry[0]);

      // iterate over database tables
      Object.values(schemaEntry[1].tables).map((tableObject) => {
        createSqlFromTableObject(sqlCommands, tableObject);
      });

    });

    // iterate over database relations
    sqlCommands.up.push(`-- relations:`);
    sqlCommands.down.push(`-- relations:`);
    Object.values(dbObject.relations).map((relation: [FullstackOne.IDbRelation]) => {

      // write error for many-to-many
      if (relation[0].type === 'MANY' && relation[1] != null && relation[1].type === 'MANY') {
        process.stdout.write(
          'migration.relation.unsupported.type: ' +
          `${relation[0].name}: ${relation[0].tableName}:${relation[1].tableName} => MANY:MANY` + '\n' +
          'Many to many relations are not yet supported by the query builder. Create a through table instead.\n'
        );

        createSqlManyToManyRelation(sqlCommands, relation);
      } else {

        if (relation[0].type === 'ONE' && relation[1] != null && relation[1].type === 'ONE') {
          process.stdout.write(
            'migration.relation.type.hint: ' +
            `${relation[0].name}: ${relation[0].tableName}:${relation[1].tableName} => ONE:ONE` + '\n' +
            'Try to avoid using one to one relations.' +
            'Consider combining both entities into one, using JSON type instead or pointing only in one direction.\n'
          );
        }

        // create one:many / one:one relation
        createRelation(sqlCommands, relation);
      }

    });

    return sqlCommands;
  }

  function createSqlForEnumObject(sqlCommands, enumTypeName, enumTypeValue) {
    sqlCommands.up.push(`-- enum types:`);
    sqlCommands.up.push(`CREATE TYPE "${enumTypeName}" AS ENUM ('${enumTypeValue.join('\',\'')}');`);

    sqlCommands.down.push(`-- enum types:`);
    sqlCommands.down.push(`DROP TYPE "${enumTypeName}";`);
  }

  function createSqlFromSchemaObject(sqlCommands, schemaName: string) {

    // avoid dropping or createing public schema
    if (schemaName !== 'public') {
      // create schema statement
      sqlCommands.up.push(`-- schema ${schemaName}:`);
      sqlCommands.up.push(`CREATE SCHEMA "${schemaName}";`);

      sqlCommands.down.push(`-- schema ${schemaName}:`);
      if (createDrop) {
        sqlCommands.down.push(`DROP SCHEMA IF EXISTS "${schemaName}";`);
      } else { // create rename instead
        sqlCommands.down.push(`ALTER SCHEMA "${schemaName}" RENAME TO "${DELETED_PREFIX}${schemaName}";`);
      }
    }

  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlCommands, tableObject: any) {
    const tableNameWithSchema = `"${tableObject.schemaName}"."${tableObject.name}"`;
    // create table statement
    sqlCommands.up.push(`-- table ${tableNameWithSchema}:`);
    sqlCommands.up.push(`CREATE TABLE ${tableNameWithSchema}();`);

    sqlCommands.down.push(`-- table ${tableNameWithSchema}:`);
    if (createDrop) {
      sqlCommands.down.push(`DROP TABLE IF EXISTS ${tableNameWithSchema};`);
    } else { // create rename instead, ignore if already renamed
      if (tableObject.name.indexOf(DELETED_PREFIX) !== 0) {
        sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} RENAME TO "${DELETED_PREFIX}${tableObject.name}";`);
      } else {
        sqlCommands.down.push(`-- Table ${tableObject.name} was already renamed instead of deleted.`);
      }
    }

    // create rename statement
    if (tableObject.oldName != null) {
      const tableNameInDB = (createDrop) ? `${DELETED_PREFIX}${tableObject.name}` : tableObject.oldName;
      const tableNameWithSchemaInDB = `"${tableObject.schemaName}"."${tableNameInDB}"`;

      sqlCommands.up.push(`ALTER TABLE ${tableNameWithSchemaInDB} RENAME TO "${tableObject.name}";`);
      sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} RENAME TO "${tableNameInDB}";`);
    }

    // create column statements
    for (const columnObject of Object.values(tableObject.columns)) {
      if (columnObject.type === 'computed') {
        // ignore computed
      } else if (columnObject.type === 'customResolver') {
        // ignore custom
      } else if (columnObject.type === 'relation') {
        // ignore relations
      } else {

        let type = columnObject.type;
        // is type an enum/custom?
        if (type === 'enum') {
          type = `"${columnObject.customType}"`;
        } else if (type === 'customType') {
          type = `${columnObject.customType}`;
        }

        // create column statement
        sqlCommands.up.push(`ALTER TABLE ${tableNameWithSchema} ADD COLUMN "${columnObject.name}" varchar;`);
        if (createDrop) {

          sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} DROP COLUMN IF EXISTS "${columnObject.name}" CASCADE;`);
        } else { // create rename instead

          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${columnObject.name}" TO "${DELETED_PREFIX}${columnObject.name}";`
          );
        }

        // set column type
        sqlCommands.up.push(
          `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" TYPE ${type} USING "${columnObject.name}"::${type};`
        );
        sqlCommands.down.push(
          `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" TYPE varchar USING "${columnObject.name}"::varchar;`
        );

        // create rename statement
        if (columnObject.oldName != null) {
          const columnNameInDB = (createDrop) ? `${DELETED_PREFIX}${columnObject.name}` : columnObject.oldName;

          sqlCommands.up.push(`ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${columnNameInDB}" TO "${columnObject.name}";`);
          sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${columnObject.name}" TO "${columnObject.OldName}";`);
        }

      }

      // add default values
      if (columnObject.defaultValue != null) {
        if (columnObject.defaultValue.isExpression) {
          // set default - expression
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" SET DEFAULT ${columnObject.defaultValue.value};`
          );
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" DROP DEFAULT;`
          );
        } else {
          // set default - value
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" SET DEFAULT '${columnObject.defaultValue.value}';`
          );
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnObject.name}" DROP DEFAULT;`
          );
        }
      }
    }

    // generate constraints for column
    sqlCommands.up.push(`-- constraints for ${tableNameWithSchema}:`);
    sqlCommands.down.push(`-- constraints for ${tableNameWithSchema}:`);
    createSqlColumnConstraints(sqlCommands, tableNameWithSchema, tableObject);
  }

  function createSqlColumnConstraints(sqlCommands, tableName, tableObject) {

    // constraints
    Object.entries(tableObject.constraints).forEach((constraint) => {
      const constraintName = constraint[0];
      const constraintDefinition = constraint[1];
      const columnNamesAsStr = (Array.isArray(constraintDefinition.columns)) ?
                                constraintDefinition.columns.map(columnName => `"${columnName}"`).join(',') : null;

      switch (constraintDefinition.type) {
        case 'not_nullable':
          sqlCommands.up.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${columnNamesAsStr} SET NOT NULL;`
          );
          sqlCommands.down.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${columnNamesAsStr} DROP NOT NULL;`
          );
          break;
        case 'PRIMARY KEY':
          /* moved to graphQlSchemaToDbObject -> expression
          // convention: all PKs are generated uuidv4
          constraintDefinition.columns.forEach((columnName) => {
            sqlCommands.push(
              `ALTER TABLE ${tableName} ALTER COLUMN "${columnName}" SET DEFAULT uuid_generate_v4();`
            );
          });
          */

          // make sure column names for constraint are set
          if (columnNamesAsStr != null) {
            sqlCommands.up.push(
              `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" PRIMARY KEY (${columnNamesAsStr});`
            );
            sqlCommands.down.push(
              `ALTER TABLE ${tableName} DROP CONSTRAINT "${constraintName}";`
            );
          }
          break;
        case 'UNIQUE':
          // make sure column names for constraint are set
          if (columnNamesAsStr != null) {
            sqlCommands.up.push(
              `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNamesAsStr});`
            );
            sqlCommands.down.push(
              `ALTER TABLE ${tableName} DROP CONSTRAINT "${constraintName}";`
            );
          }
          break;
        case 'CHECK':
          const checkExpression = constraintDefinition.options.param1;
          sqlCommands.up.push(
            `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" CHECK (${checkExpression});`
          );

          sqlCommands.down.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT "${constraintName}";`
          );
          break;
      }
    });

    return sqlCommands;
  }

  function createRelation(sqlCommands, relationObject: [FullstackOne.IDbRelation]) {

    relationObject.map(createSqlRelation);

    function createSqlRelation(oneRelation: FullstackOne.IDbRelation) {

      // ignore the 'MANY' side
      if (oneRelation.type !== 'MANY') {
        const tableName = `"${oneRelation.schemaName}"."${oneRelation.tableName}"`;

        // create column for FK // convention: uuid
        sqlCommands.up.push(
          `ALTER TABLE ${tableName} ADD COLUMN "${oneRelation.columnName}" uuid;`
        );
        sqlCommands.down.push(
          `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS "${oneRelation.columnName}" CASCADE;`
        );

        // add foreign key
        const constraintName = `fk_${oneRelation.name}`;
        // drop constraint is needed for up and down
        const downConstraintStatement = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}"`;
        // first we need to drop a possible existing one, in order to update onUpdate and onDelete
        let upConstraintStatement = `${downConstraintStatement}, `;
        // and add a new version with all attributes
        upConstraintStatement += `ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${oneRelation.columnName}") ` +
          `REFERENCES "${oneRelation.reference.schemaName}"."${oneRelation.reference.tableName}"("${oneRelation.reference.columnName}")`;

        // check onUpdate and onDelete
        if (oneRelation.onDelete != null) {
          upConstraintStatement += ` ON DELETE ${oneRelation.onDelete}`;
        }
        if (oneRelation.onUpdate != null) {
          upConstraintStatement += ` ON UPDATE ${oneRelation.onUpdate}`;
        }

        sqlCommands.up.push(
          upConstraintStatement + ';'
        );
        sqlCommands.down.push(
          downConstraintStatement + ';'
        );

        sqlCommands.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS '${JSON.stringify(relationObject)}';`);
        sqlCommands.down.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS NULL;`);
      }
    }

  }

  function createSqlManyToManyRelation(sqlCommands, relationObject: [FullstackOne.IDbRelation]) {

    const relation1: FullstackOne.IDbRelation = relationObject[0];
    const relation2: FullstackOne.IDbRelation = relationObject[1];

    // create fk column 1
    const tableName1 = `"${relation1.schemaName}"."${relation1.tableName}"`;
    sqlCommands.up.push(
      `ALTER TABLE ${tableName1} ADD COLUMN "${relation1.columnName}" uuid[];`
    );
    sqlCommands.down.push(
      `ALTER TABLE ${tableName1} DROP COLUMN IF EXISTS "${relation1.columnName}" CASCADE;`
    );

    // add comment with meta information
    sqlCommands.up.push(`COMMENT ON COLUMN ${tableName1}."${relation1.columnName}" IS '${JSON.stringify(relation1)}';`);
    // has to be exact same id in both -> empty
    sqlCommands.down.push(`COMMENT ON COLUMN ${tableName1}."${relation1.columnName}" IS NULL;`);

    // create fk column 2
    const tableName2 = `"${relation2.schemaName}"."${relation2.tableName}"`;
    sqlCommands.up.push(
      `ALTER TABLE ${tableName2} ADD COLUMN "${relation2.columnName}" uuid[];`
    );
    sqlCommands.down.push(
      `ALTER TABLE ${tableName2} DROP COLUMN IF EXISTS "${relation2.columnName}" CASCADE;`
    );

    // add comment with meta information
    sqlCommands.up.push(`COMMENT ON COLUMN ${tableName2}."${relation2.columnName}" IS '${JSON.stringify(relation2)}';`);
    // has to be exact same id in both -> empty
    sqlCommands.down.push(`COMMENT ON COLUMN ${tableName2}."${relation2.columnName}" IS NULL;`);

    // todo create trigger to check consistency and cascading

  }
}
