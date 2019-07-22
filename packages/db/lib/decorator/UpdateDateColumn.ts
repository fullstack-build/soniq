import { ORM } from "..";
import * as ModelMeta from "../model-meta";
import { IModelMeta } from "../model-meta/types";
import { ILogger } from "@fullstack-one/logger";

import * as typeorm from "typeorm";

// tslint:disable-next-line:function-name
export default function UpdateDateColumn(options?: typeorm.ColumnOptions) {
  const typeormDecorator = typeorm.Column({ ...options, type: "timestamp without time zone", default: () => "now()" });
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    ModelMeta.addColumnExtension(entityName, columnName, ["updatedat", true]);

    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}

interface IColumn {
  schemaName: string;
  tableName: string;
  columnName: string;
}

export async function createUpdatedAtTrigger(orm: ORM, logger: ILogger) {
  const modelMeta = orm.getModelMeta();
  const columns = getUpdatedAtColumnsFromModelMeta(modelMeta);
  const queryRunner = orm.createQueryRunner();
  try {
    queryRunner.connect();
    const promises: Array<Promise<any>> = columns.map(({ schemaName, tableName, columnName }) => {
      return queryRunner.query(`
        DROP TRIGGER IF EXISTS "table_trigger_updatedat" ON "${schemaName}"."${tableName}";
        CREATE TRIGGER "table_trigger_updatedat"
          BEFORE UPDATE
          ON "${schemaName}"."${tableName}"
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.triggerupdateorcreate('${columnName}');
        `);
    });
    await Promise.all(promises);
  } catch (error) {
    logger.error("Failed creating updatedAt triggers.", error);
  }
}

function getUpdatedAtColumnsFromModelMeta(modelMeta: IModelMeta): IColumn[] {
  const updatedAtColumns: IColumn[] = [];
  Object.values(modelMeta.entities).forEach(({ name: tableName, columns, entityOptions }) => {
    const schemaName = entityOptions.schema || "public";
    Object.values(columns).forEach(({ name: columnName, extensions: { updatedat } }) => {
      if (updatedat != null) {
        updatedAtColumns.push({ schemaName, tableName, columnName });
      }
    });
  });
  return updatedAtColumns;
}
