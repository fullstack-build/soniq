import * as FullstackOne from '../core';

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

      const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      // tslint:disable-next-line:no-console
      console.error('sql statements: \n', sqlStatements);
      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

      // display result sql in terminal
      // this.logger.debug(sqlStatements.join('\n'));
    } catch (err) {
      // this.logger.warn('loadFilesByGlobPattern error', err);
      // emit event
      // this.emit('schema.load.error');
    }
  }
  export function createSqlFromDbObject(
    databaseObject: FullstackOne.IDatabaseObject,
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
      // console.error(relation);
      // only parse those with isDbModel = true
      /*if (!!tableObject.isDbModel) {
				createSqlFromTableObject(sqlCommands, tableObject);
			}*/
    });

    return sqlCommands;
  }

  function createSqlFromTableObject(sqlCommands, pTableObject) {
    // create table statement
    sqlCommands.push(
      `CREATE TABLE "${pTableObject.schemaName}.${pTableObject.name}"();`,
    );

    // create column statements
    for (const field of pTableObject.fields) {
      if (field.type === 'computed') {
        // ignore computed
      } else if (field.type === 'relation') {
        // ignore relations
      } else {
        const fieldStatementArray = [];
        fieldStatementArray.push(
          `ALTER TABLE "${pTableObject.schemaName}.${pTableObject.name}" ADD COLUMN "${field.name}"`,
        );

        // add type
        fieldStatementArray.push(field.type);

        // constraints

        // primary key
        if (!!field.constraints.isPrimaryKey) {
          fieldStatementArray.push('PRIMARY KEY');
        }

        // unique
        if (!!field.constraints.unique) {
          fieldStatementArray.push('UNIQUE');
        }

        // not null
        if (!!field.constraints.nullable) {
          fieldStatementArray.push('NOT NULL');
        }

        // add end of statement
        fieldStatementArray.push(';');

        const fieldStatementStr = fieldStatementArray.join(' ');
        sqlCommands.push(fieldStatementStr);
      }
    }
  }

}
