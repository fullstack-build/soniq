import * as FullstackOne from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';
import getRelationForeignTable from '../graphQl/parser/getRelationForeignTable';

export namespace migration {

  export async function createMigration() {
    const $one = FullstackOne.getInstance();

    try {
      // write parsed schema into migrations folder
      /*await graphQlHelper.writeTableObjectIntoMigrationsFolder(
        `${this.ENVIRONMENT.path}/migrations/`,
        tableObjects,
        optionalMigrationId,
      );
      // emit event
      this.emit('schema.dbObject.migration.saved');*/

      const viewSqlStatements = createViewsFromDbObject($one.getDbObject(), 'appuserhugo', false);

      const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      // tslint:disable-next-line:no-console
      console.log(sqlStatements.join('\n'));

      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

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
  export function createSqlFromDbObject(
    dbObject: FullstackOne.IDbObject,
  ): string[] {
    const sqlCommands: string[] = [];

    // iterate over enums
    Object.entries(dbObject.enums).map((enumTypeArray) => {
      createSqlForEnumObject(sqlCommands, enumTypeArray[0], enumTypeArray[1]);
    });

    // iterate over database tables
    Object.values(dbObject.tables).map((tableObject) => {
      // only parse those with isDbModel = true
      if (!!tableObject.isDbModel) {
        createSqlFromTableObject(sqlCommands, tableObject);
      }
    });

    // iterate over database relations
    sqlCommands.push(`-- relations:`);
    Object.values(dbObject.relations).map((relation) => {

      // write error for many-to-many
      if (relation[0].type === 'MANY' && relation[1] != null && relation[1].type === 'MANY') {
        process.stdout.write(
          'migration.relation.unsupported.type: ' +
          `${relation[0].name}: ${relation[0].tableName}:${relation[1].tableName} => MANY:MANY` + '\n' +
          'Many to many relations are not yet supported by the query builder. Create a through table instead.\n'
        );

        createSqlManyToManyRelation(sqlCommands, relation[0], relation[1]);
      } else {

        if (relation[0].type === 'ONE' && relation[1] != null && relation[1].type === 'ONE') {
          process.stdout.write(
            'migration.relation.type.hint: ' +
            `${relation[0].name}: ${relation[0].tableName}:${relation[1].tableName} => ONE:ONE` + '\n' +
            'Try to avoid using one to one relations.' +
            'Consider combining both entities into one, using JSON type instead or pointing only in one direction.\n'
          );
        }

        // check if both relation tables exists
        if (dbObject.tables[relation[0].tableName] != null) {
          createSqlRelation(sqlCommands, relation[0]);
        }
        if (relation[1] != null && dbObject.tables[relation[1].tableName] != null) {
          createSqlRelation(sqlCommands, relation[1]);
        }
      }

    });

    return sqlCommands;
  }

  function createSqlForEnumObject(sqlCommands, enumTypeName, enumTypeValue) {
    sqlCommands.push(`-- enum types:`);
    sqlCommands.push(`CREATE TYPE "${enumTypeName}" AS ENUM ('${enumTypeValue.join('\',\'')}');`);
  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlCommands, tableObject: any) {
    const tableName = `"${tableObject.schemaName}"."${tableObject.name}"`;
    // create table statement
    sqlCommands.push(`-- table ${tableName}:`);
    sqlCommands.push(`CREATE TABLE ${tableName}();`);

    // create column statements
    for (const columnObject of tableObject.columns) {
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
        sqlCommands.push(`ALTER TABLE ${tableName} ADD COLUMN "${columnObject.name}" varchar;`);
        // set column type
        sqlCommands.push(
          `ALTER TABLE ${tableName} ALTER COLUMN "${columnObject.name}" TYPE ${type} USING "${columnObject.name}"::${type};`
        );
      }

      // add default values
      if (columnObject.defaultValue != null) {
        if (columnObject.defaultValue.isExpression) {
          // set default - expression
          sqlCommands.push(
            `ALTER TABLE ${tableName} ALTER COLUMN "${columnObject.name}" SET DEFAULT  ${columnObject.defaultValue.value};`
          );
        } else {
          // set default - value
          sqlCommands.push(
            `ALTER TABLE ${tableName} ALTER COLUMN "${columnObject.name}" SET DEFAULT '${columnObject.defaultValue.value}';`
          );
        }
      }
    }

    // generate constraints for column
    sqlCommands.push(`-- constraints for ${tableName}:`);
    createSqlColumnConstraints(sqlCommands, tableName, tableObject);
  }

  function createSqlColumnConstraints(sqlCommands, tableName, tableObject) {

    // constraints
    Object.entries(tableObject.constraints).forEach((constraint) => {
      const constraintName = constraint[0];
      const constraintDefinition = constraint[1];
      const columnNamesAsStr = constraintDefinition.columns.map(columnName => `"${columnName}"`).join(',');

      switch (constraintDefinition.type) {
        case 'primaryKey':
          // convention: all PKs are generated uuidv4
          constraintDefinition.columns.forEach((columnName) => {
            sqlCommands.push(
              `ALTER TABLE ${tableName} ALTER COLUMN "${columnName}" SET DEFAULT uuid_generate_v4();`
            );
          });

          // make PK
          sqlCommands.push(
            `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" PRIMARY KEY (${columnNamesAsStr});`
          );
        break;
        case 'not_null':
          sqlCommands.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${columnNamesAsStr} SET NOT NULL;`
          );
        break;
        case 'unique':
          sqlCommands.push(
            `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNamesAsStr});`
          );
        break;
        case 'validate':
          const param1 = constraintDefinition.options.param1;
          const param2 = (constraintDefinition.options.param2 != null) ? constraintDefinition.options.param2 : '';
          sqlCommands.push(
            `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" CHECK (_meta.validate(${columnNamesAsStr}, '${param1}', '${param2}'));`
          );
        break;
      }
    });

    return sqlCommands;
  }

  function createSqlRelation(sqlCommands, relationObject: FullstackOne.IDbRelation) {

    // ignore the 'MANY' side
    if (relationObject.type !== 'MANY') {
      const tableName = `"${relationObject.schemaName}"."${relationObject.tableName}"`;

      // create column for FK // convention: uuid
      sqlCommands.push(
        `ALTER TABLE ${tableName} ADD COLUMN "${relationObject.columnName}" uuid;`
      );

      // add foreign key
      const constraintName = `fk_${relationObject.name}`;
      // first we need to drop a possible existing one, in order to update onUpdate and onDelete
      let constraintStatement = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}", `;
      // and add a new version with all attributes
      constraintStatement += `ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${relationObject.columnName}") ` +
        `REFERENCES "${relationObject.reference.schemaName}"."${relationObject.reference.tableName}"("${relationObject.reference.columnName}")`;

      // check onUpdate and onDelete
      if (relationObject.onDelete != null) {
        constraintStatement += ` ON DELETE ${relationObject.onDelete}`;
      }
      if (relationObject.onUpdate != null) {
        constraintStatement += ` ON UPDATE ${relationObject.onUpdate}`;
      }

      sqlCommands.push(
        constraintStatement + ';'
      );
    }
  }

  function createSqlManyToManyRelation(sqlCommands, relation1: FullstackOne.IDbRelation, relation2: FullstackOne.IDbRelation) {

    // create fk column 1
    const tableName1 = `"${relation1.schemaName}"."${relation1.tableName}"`;
    sqlCommands.push(
      `ALTER TABLE ${tableName1} ` +
      `ADD COLUMN "${relation1.columnName}" uuid[];`
    );

    // create fk column 2
    const tableName2 = `"${relation2.schemaName}"."${relation2.tableName}"`;
    sqlCommands.push(
      `ALTER TABLE ${tableName2} ` +
      `ADD COLUMN "${relation2.columnName}" uuid[];`
    );

    // todo create trigger to check consistency and cascading

  }
}
