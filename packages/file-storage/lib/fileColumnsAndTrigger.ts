import { isArray } from "util";
import { Pool, PoolClient } from "@fullstack-one/core";
import { ILogger } from "@fullstack-one/logger";

interface IFileColumn {
  schemaName: string;
  tableName: string;
  columnName: string;
  types: string[];
}

interface ISchemaTable {
  schemaName: string;
  tableName: string;
}

export async function insertFileColumnsAndCreateTrigger(pgPool: Pool, logger: ILogger): Promise<void> {
  const fileColumnsTableName = `_meta.FileColumns`;

  // const pgClient = await pgPool.connect();
  // const queryBuilder = orm.getConnection().createQueryBuilder();
  // queryBuilder.setQueryRunner(pgClient);
  // await pgClient.connect();

  // await pgClient.startTransaction();
  /*
  try {
    const modelMeta: IModelMeta = orm.getModelMeta();
    const fileColumns: IFileColumn[] = getFileColumnsFromModelMeta(modelMeta);

    await queryBuilder
      .delete()
      .from(fileColumnsTableName)
      .execute();
    const insertPromises = fileColumns.map(({ schemaName, tableName, columnName, types }) => {
      return queryBuilder
        .insert()
        .into(fileColumnsTableName)
        .values({ schemaName, tableName, columnName, types: JSON.stringify(types) })
        .onConflict(`("schemaName", "tableName", "columnName") DO UPDATE SET "types"=$4;`)
        .execute();
    });
    await Promise.all(insertPromises);

    const schemaTables: ISchemaTable[] = getTablesWithFiles(fileColumns);
    const createTriggerPromises = schemaTables.map(({ schemaName, tableName }) => {
      return createTrigger(pgClient, schemaName, tableName);
    });
    await Promise.all(createTriggerPromises);

    await pgClient.commitTransaction();
  } catch (err) {
    logger.warn("insertFileColumnsAndCreateTrigger.error", err);
    await pgClient.rollbackTransaction();
  }*/
}

/* function getFileColumnsFromModelMeta(modelMeta: IModelMeta): IFileColumn[] {
  const fileColumns: IFileColumn[] = [];
  Object.values(modelMeta.entities).forEach(({ name: tableName, columns, entityOptions }) => {
    const schemaName = entityOptions.schema || "public";
    Object.values(columns).forEach(({ name: columnName, extensions: { files } }) => {
      if (files != null && isArray(files)) {
        const types = files;
        fileColumns.push({ schemaName, tableName, columnName, types });
      }
    });
  });
  return fileColumns;
}*/

function getTablesWithFiles(fileColumns: IFileColumn[]): ISchemaTable[] {
  const schemaTables: ISchemaTable[] = [];

  fileColumns.forEach(({ schemaName, tableName }) => {
    if (schemaTables.find((schemaTable) => schemaTable.schemaName === schemaName && schemaTable.tableName === tableName) == null) {
      schemaTables.push({ schemaName, tableName });
    }
  });

  return schemaTables;
}

async function createTrigger(pgClient: PoolClient, schemaName: string, tableName: string): Promise<void> {
  const triggerName = `"table_file_trigger_${schemaName}_${tableName}"`;
  const schmeaTableName = `"${schemaName}"."${tableName}"`;
  await pgClient.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${schmeaTableName} CASCADE;`);
  await pgClient.query(`
    CREATE TRIGGER ${triggerName}
    BEFORE UPDATE OR INSERT OR DELETE
    ON ${schmeaTableName}
    FOR EACH ROW
    EXECUTE PROCEDURE _meta.file_trigger();
  `);
}
