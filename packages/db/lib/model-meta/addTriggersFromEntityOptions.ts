import { IEntityMeta } from "./types";

export default function addTriggersFromEntityOptions(entityMeta: IEntityMeta): void {
  const schemaName = entityMeta.entityOptions.schema || "public";
  const entityName = entityMeta.name;
  if (entityMeta.entityOptions.triggers != null && entityMeta.entityOptions.triggers.length != null) {
    entityMeta.triggers.push(...entityMeta.entityOptions.triggers);
  }
  if (entityMeta.entityOptions.updatable === false) {
    entityMeta.triggers.push({
      name: `table_is_not_updatable_${schemaName}_${entityName}`,
      when: "BEFORE",
      operations: ["UPDATE"],
      functionName: "_meta.make_table_immutable",
      functionArguments: []
    });
  }
  if (entityMeta.entityOptions.deletable === false) {
    entityMeta.triggers.push({
      name: `table_is_not_deletable_${schemaName}_${entityName}`,
      when: "BEFORE",
      operations: ["DELETE"],
      functionName: "_meta.make_table_immutable",
      functionArguments: []
    });
  }
}
