import * as FullstackOne from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';

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

      const viewSqlStatements = createViewsFromDbObject($one.getDbObject(), 'appuserhugo');
      // tslint:disable-next-line:no-console
      console.log('view sql statements: \n', viewSqlStatements);

      const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      // tslint:disable-next-line:no-console
      console.log('sql statements: \n', sqlStatements);
      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

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
    databaseObject: FullstackOne.IDbObject,
  ): string[] {
    const sqlCommands: string[] = [];

    // iterate over database tables
    Object.values(databaseObject.tables).map((tableObject) => {
      // only parse those with isDbModel = true
      if (!!tableObject.isDbModel) {
        createSqlFromTableObject(sqlCommands, tableObject);
      }
    });

    // iterate over database relations
    Object.values(databaseObject.relations).map((relation) => {
      // check if relation exists
      // console.log('*', relation);
      // only parse those with isDbModel = true
      /*if (!!tableObject.isDbModel) {
				createSqlFromTableObject(sqlCommands, tableObject);
			}*/
    });

    return sqlCommands;
  }

  function createSqlFromTableObject(sqlCommands, tableObject) {
    const tableName = `"${tableObject.schemaName}"."${tableObject.name}"`;
    // create table statement
    sqlCommands.push(
      `CREATE TABLE ${tableName}();`,
    );

    // create column statements
    for (const columnObject of tableObject.columns) {
      if (columnObject.type === 'computed') {
        // ignore computed
      } else if (columnObject.type === 'custom') {
        // ignore custom
      } else if (columnObject.type === 'relation') {
        // ignore relations
      } else {
        // create column statement
        sqlCommands.push(`ALTER TABLE ${tableName} ADD COLUMN "${columnObject.name}" ${columnObject.type};`);

        // generate constraints for column
        createColumnConstraints(sqlCommands, tableName, columnObject);

      }
    }
  }

  function createColumnConstraints(sqlCommands, tableName, columnObject) {

        const multiColumnUniqueConstraint = [];
        // constraints
        Object.entries(columnObject.constraints).forEach((columnConstraint) => {
          const columnConstraintsStatementPrefix: string = `ALTER TABLE ${tableName}`;
          // tslint:disable-next-line:no-console
          // console.log(columnConstraint);

          // primary key
          if (columnConstraint[0] === 'isPrimaryKey' && !!columnConstraint[1]) {
            // make PK
            sqlCommands.push(
              `${columnConstraintsStatementPrefix} ADD PRIMARY KEY ("${columnObject.name}");`
            );
            // assumption: all PKs are generated uuidv4
            sqlCommands.push(
              `${columnConstraintsStatementPrefix} ALTER COLUMN "${columnObject.name}" SET DEFAULT uuid_generate_v4();`
            );
          }
          // handle single unique
          if (columnConstraint[0] === 'unique' && typeof columnConstraint[1] === 'boolean' && !!columnConstraint[1]) {
            sqlCommands.push(
              `${columnConstraintsStatementPrefix} ADD CONSTRAINT "unique_${columnObject.name}" UNIQUE ("${columnObject.name}");`
            );
          }
          // multy column unique
          if (columnConstraint[0] === 'unique' && typeof columnConstraint[1] === 'string') {
            // console.error('***Multi column unique',  columnObject.name);
          }
        });

        // create unique constraints
        // console.error('***');

/*

        // unique
        if (!!field.constraints.unique) {
          fieldStatementArray.push('UNIQUE');
        }

        // not null
        if (!!field.constraints.nullable) {
          fieldStatementArray.push('NOT NULL');
        }
        */

    // add end of statement
    // fieldStatementArray.push(';');

    return sqlCommands;
  }

}
