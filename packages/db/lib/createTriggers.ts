import { Logger } from "@fullstack-one/logger";
import { ORM } from ".";
import { IModelMeta, IEntityMeta } from "./model-meta/types";

export default async function createTriggers(orm: ORM, logger: Logger) {
  const modelMeta: IModelMeta = orm.getModelMeta();
  const entities: IEntityMeta[] = Object.values(modelMeta.entities);
  const triggerCreationQueries: string[] = entities.map((entity) => generateTriggerCreationQuery(entity));
  const queryRunner = orm.createQueryRunner();
  try {
    queryRunner.connect();
    await queryRunner.query(`SELECT "_meta".strip_all_triggers();`);
    const promises: Array<Promise<any>> = triggerCreationQueries.map((query) => {
      return queryRunner.query(query);
    });
    await Promise.all(promises);
  } catch (error) {
    logger.error("Failed creating updatedAt triggers.", error);
  }
}

function generateTriggerCreationQuery({ entityOptions, name: entityName, triggers }: IEntityMeta): string {
  const schemaName = entityOptions.schema || "public";
  return triggers
    .map((trigger) => {
      return `
      CREATE TRIGGER ${trigger.name}
      ${trigger.when} ${trigger.operations.join(" OR ")}
      ON "${schemaName}"."${entityName}"
      FOR EACH ROW
      EXECUTE PROCEDURE ${trigger.functionName}(${trigger.functionArguments.map((arg) => `'${arg}'`).join(", ")});
    `;
    })
    .join("\n");
}
