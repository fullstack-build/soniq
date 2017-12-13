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

      const viewSqlStatements = createViewsFromDbObject($one.getDbObject(), 'appuserhugo', false);

      const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      // tslint:disable-next-line:no-console
      // console.log('sql statements: \n', sqlStatements);
      // tslint:disable-next-line:forin
      for (const i in sqlStatements) {
        // tslint:disable-next-line:no-console
        console.log(sqlStatements[i]);
      }
      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

      // tslint:disable-next-line:no-console
      // console.log('view sql statements: \n', viewSqlStatements);

      // tslint:disable-next-line:forin
      for (const i in viewSqlStatements) {
        // tslint:disable-next-line:no-console
        console.log(viewSqlStatements[i]);
      }

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
    sqlCommands.push(`-- relations:`);
    Object.values(databaseObject.relations).map((relation) => {

      // todo write error for many-to-many

      // check if both relation tables exists
      if (databaseObject.tables[relation[0].tableName] != null) {
        createRelations(sqlCommands, relation[0]);
      }
      if (relation[1] != null && databaseObject.tables[relation[1].tableName] != null) {
        createRelations(sqlCommands, relation[1]);
      }

    });

    return sqlCommands;
  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlCommands, tableObject) {
    const tableName = `"${tableObject.schemaName}"."${tableObject.name}"`;
    // create table statement
    sqlCommands.push(`-- table ${tableName}:`);
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
        sqlCommands.push(`ALTER TABLE ${tableName} ADD COLUMN "${columnObject.name}" varchar;`);
        // set column type
        sqlCommands.push(
          `ALTER TABLE ${tableName} ALTER COLUMN "${columnObject.name}" TYPE ${columnObject.type} USING "${columnObject.name}"::${columnObject.type};`
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
    createColumnConstraints(sqlCommands, tableName, tableObject);
  }

  function createColumnConstraints(sqlCommands, tableName, tableObject) {

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
      }
    });

    return sqlCommands;
  }

  function createRelations(sqlCommands, relationObject) {

    const tableName = `"${relationObject.schemaName}"."${relationObject.tableName}"`;

    // create column for FK // convention: uuid
    sqlCommands.push(
      `ALTER TABLE ${tableName} ` +
      `ADD COLUMN "${relationObject.columnName}" uuid;`
    );

    // add foreign key
    // convention: every row has an id column that will be refenrenced
    sqlCommands.push(
      `ALTER TABLE ${tableName} ` +
      `ADD CONSTRAINT "fk_${relationObject.name}" FOREIGN KEY ("${relationObject.columnName}") ` +
      `REFERENCES "${relationObject.reference.schemaName}"."${relationObject.reference.tableName}"("${relationObject.reference.columnName}");`
    );
  }
}
