import { IDbObject, IDbRelation } from '../core/IDbObject';

export async function pgToDbObject($one): Promise<IDbObject> {
  const dbObject: IDbObject = {
    tables: {},
    relations: {},
    enums: {},
    views: []
  };

  try {
    const dbClient = $one.getDbSetupClient();
    await iterateTables(dbClient, dbObject, 'public');

    return { ...dbObject };
  } catch (err) {
    // console.error('err', err);
  }

  // return copy instead of ref
}

async function iterateTables(dbClient, dbObject, schemaName): Promise<void> {

  try {
    const dbTables = await dbClient.query(
      `SELECT
        table_name
    FROM
      information_schema.tables
    WHERE
      table_schema ='${schemaName}' AND table_type='BASE TABLE';`
    );
    // iterate all tables
    for (const row of Object.values(dbTables.rows)) {
      const tableName = row.table_name;

      dbObject.tables[tableName] = {
        isDbModel: true,
        schemaName,
        name: tableName,
        description: '',
        columns: [],
        constraints: {}
      };

      // continue with columns
      await iterateColumns(dbClient, dbObject, schemaName, tableName);
    }

  } catch (err) {
    throw err;
  }

}

async function iterateColumns(dbClient, dbObject, schemaName, tableName): Promise<void> {

  try {

    const dbColumns = await dbClient.query(
      `SELECT
        column_name,
        column_default,
        is_nullable,
        data_type,
        udt_name,
        character_maximum_length
      FROM
        information_schema.columns
      WHERE
        table_schema = '${schemaName}'
        AND
        table_name = '${tableName}'
      ORDER BY
        ordinal_position ASC;`
    );

    // iterate all columns
    for (const column of Object.values(dbColumns.rows)) {

      let type = column.udt_name;
      let customType = null;
      if (column.data_type === 'USER-DEFINED') {
        customType = type;
        type = 'enum';

      }

      const newColumn = {
        name: column.column_name,
        description: '',
        type,
        customType
      };

      dbObject.tables[tableName].columns.push(newColumn);
    }

  } catch (err) {
    throw err;
  }
}
