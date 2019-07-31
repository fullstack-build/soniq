import * as _ from "lodash";
import addTriggersFromEntityOptions from "./addTriggersFromEntityOptions";
import checkAndAdjustColumnOptions from "./check-and-adjust-column-options";
import { generateSdl } from "./generateSdl";
import {
  IModelMeta,
  IEntityMeta,
  TEntityOptions,
  IColumnMeta,
  TColumnOptions,
  ITriggerDefinition,
  GqlScalarFieldType,
  ITypeMeta,
  IFieldMeta
} from "./types";

export { TEntityOptions, TColumnOptions } from "./types";

const modelMeta: IModelMeta = {
  entities: {},
  enums: {},
  types: {}
};

// ============= Enum

function registerEnum(name: string, enumObj: object): void {
  const values: string[] = Object.entries(enumObj)
    .filter(([key, value]) => typeof value === "string")
    .map(([key, value]) => value);
  if (modelMeta.enums[name] != null) {
    if (_.isEqual(modelMeta.enums[name].values.sort(), values.sort()) === true) return;
    throw Error(`
      orm.model.meta.enum.duplicate.name: ${name} with values ${modelMeta.enums[name].values} already exists.
      New enum with values ${values} cannot be registerd.
    `);
  }
  modelMeta.enums[name] = { name, values };
}

// ============= EntityMeta

function createEntityMetaIfNotExists(entityName: string): IEntityMeta {
  if (modelMeta.entities[entityName] == null) {
    modelMeta.entities[entityName] = {
      name: entityName,
      columns: {},
      directives: [],
      entityOptions: {},
      triggers: [],
      synchronized: false
    };
  }
  return modelMeta.entities[entityName];
}

export function addEntityMeta(entityName: string): void {
  createEntityMetaIfNotExists(entityName);
}

export function addEntityDirective(entityName: string, directive: string): void {
  const entityMeta = createEntityMetaIfNotExists(entityName);
  entityMeta.directives.push(directive);
}

export function addEntityOptions(entityName: string, entityOptions: TEntityOptions): void {
  const entityMeta = createEntityMetaIfNotExists(entityName);
  entityMeta.entityOptions = { ...entityMeta.entityOptions, ...entityOptions };
}

export function addEntityTrigger(entityName: string, trigger: ITriggerDefinition): void {
  const entityMeta = createEntityMetaIfNotExists(entityName);
  entityMeta.triggers.push(trigger);
}

export function getFinalEntityOptions(entityName: string): TEntityOptions {
  const { entityOptions } = createEntityMetaIfNotExists(entityName);
  const schema = entityOptions.schema !== "public" && entityOptions.schema != null ? entityOptions.schema : undefined;
  return { ...entityOptions, schema };
}

export function setEntitySynchronizedTrue(entityName: string): void {
  const entityMeta = createEntityMetaIfNotExists(entityName);
  addTriggersFromEntityOptions(entityMeta);
  entityMeta.synchronized = true;
}

// ============= ColumnMeta

function createColumnMetaIfNotExists(entityName: string, columnName: string): IColumnMeta {
  const entitiyMeta = createEntityMetaIfNotExists(entityName);
  return entitiyMeta.columns[columnName] == null ? createColumnMeta(entityName, columnName) : entitiyMeta.columns[columnName];
}

export function createColumnMeta(entityName: string, columnName: string, columnOptions: TColumnOptions = {}, directives: string[] = []): IColumnMeta {
  const entitiyMeta = createEntityMetaIfNotExists(entityName);
  if (entitiyMeta.columns[columnName] != null) throw new Error(`orm.column.already.exists: ${entityName}.${columnName}`);
  entitiyMeta.columns[columnName] = {
    name: columnName,
    columnOptions: { name: columnName, ...columnOptions },
    directives,
    extensions: {},
    synchronized: false
  };
  return entitiyMeta.columns[columnName];
}

export function getFinalColumnOptions(entityName: string, columnName: string): TColumnOptions {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  return checkAndAdjustColumnOptions(columnMeta.columnOptions);
}

export function addColumnOptions(entityName: string, columnName: string, columnOptions: TColumnOptions): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.columnOptions = { ...columnMeta.columnOptions, ...columnOptions };
}

export function addColumnDirective(entityName: string, columnName: string, directive: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.directives.push(directive);
}

export function addColumnExtension(entityName: string, columnName: string, extension: [string, any]): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  const [extensionName, extensionValue] = extension;
  columnMeta.extensions[extensionName] = extensionValue;
}

export function setColumnSynchronizedTrue(entityName: string, columnName: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  const { columnOptions } = columnMeta;
  if (columnOptions.enum != null && columnOptions.enumName != null) registerEnum(columnOptions.enumName, columnOptions.enum);
  columnMeta.synchronized = true;
}

export function isColumnSynchronized(entityName: string, columnName: string): boolean {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  return columnMeta.synchronized === true;
}

// ============= FieldMeta

export function addType(typeName: string): ITypeMeta {
  if (modelMeta.types[typeName] == null) {
    modelMeta.types[typeName] = {
      name: typeName,
      fields: {}
    };
  }
  return modelMeta.types[typeName];
}

export function addField(typeName: string, fieldName: string, gqlType: GqlScalarFieldType | string): IFieldMeta {
  const typeMeta = addType(typeName);
  if (typeMeta.fields[fieldName] == null) {
    typeMeta.fields[fieldName] = {
      name: fieldName,
      gqlType
    };
  }
  return typeMeta.fields[fieldName];
}

// ============= Generate

export function get(): IModelMeta {
  return JSON.parse(JSON.stringify(modelMeta));
}

export function toString(): string {
  return JSON.stringify(modelMeta, null, 2);
}

export function toSdl(): string {
  return generateSdl(modelMeta);
}
