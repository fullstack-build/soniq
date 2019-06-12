import * as typeorm from "typeorm";
import * as _ from "lodash";

export type GqlFieldType = "String" | "Int" | "Float" | "Boolean" | "JSON" | "ID";

export interface IColumnMeta {
  name: string;
  gqlType?: GqlFieldType | string;
  enumName?: string;
  directives: string[];
  columnOptions: typeorm.ColumnOptions;
  synchronized: boolean;
  nullable: boolean;
}

export interface IEntityMeta {
  name?: string;
  columns?: {
    [columnName: string]: IColumnMeta;
  };
  isTypeormEntity?: boolean;
  decoratorTarget?: () => void;
  synchronized?: boolean;
}

interface IEnum {
  name: string;
  values: string[];
}

interface IModelMeta {
  entities: {
    [entityName: string]: IEntityMeta;
  };
  enums: {
    [enumName: string]: IEnum;
  };
}

const modelMeta: IModelMeta = {
  entities: {},
  enums: {}
};

export function registerEnum(name: string, enumObj: object): void {
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
  Reflect.defineMetadata("enum:name", name, enumObj);
}

function createEntityMetaIfNotExists(entityName: string): IEntityMeta {
  if (modelMeta.entities[entityName] == null) {
    modelMeta.entities[entityName] = {
      name: entityName,
      columns: {},
      synchronized: true
    };
  }
  return modelMeta.entities[entityName];
}

export function enhanceEntityMeta(entityName: string, entityMeta: IEntityMeta): void {
  const currentEntityMeta = createEntityMetaIfNotExists(entityName);
  modelMeta.entities[entityName] = { name: entityName, ...currentEntityMeta, ...entityMeta };
}

function createColumnMetaIfNotExists(entityName: string, columnName: string): IColumnMeta {
  const entitiyMeta = createEntityMetaIfNotExists(entityName);
  if (entitiyMeta.columns[columnName] == null) {
    entitiyMeta.columns[columnName] = {
      name: columnName,
      columnOptions: {},
      directives: [],
      synchronized: false,
      nullable: false
    };
  }
  return entitiyMeta.columns[columnName];
}

export function addEntityMeta(entityName: string): void {
  createEntityMetaIfNotExists(entityName);
}

export function setEntitySynchronizedTrue(entityName: string): void {
  const entityMeta = createEntityMetaIfNotExists(entityName);
  entityMeta.synchronized = true;
}

export function getColumnOptions(entityName: string, columnName: string): typeorm.ColumnOptions {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  return { ...columnMeta.columnOptions, nullable: columnMeta.nullable };
}

export function setColumnGqlType(entityName: string, columnName: string, gqlType: GqlFieldType | string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.gqlType = gqlType;
}

export function setColumnEnum(entityName: string, columnName: string, enumObj: object): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  const enumName = Reflect.getMetadata("enum:name", enumObj);
  if (enumName == null || modelMeta.enums[enumName] == null) throw new Error(`orm.set.column.enum.unknown: ${enumName}: ${JSON.stringify(enumObj)}`);
  columnMeta.enumName = enumName;
  columnMeta.columnOptions = { ...columnMeta.columnOptions, type: "enum", enum: modelMeta.enums[enumName].values };
}

export function addColumnDirective(entityName: string, columnName: string, directive: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.directives.push(directive);
}

export function addColumnOptions(entityName: string, columnName: string, columnOptions: typeorm.ColumnOptions): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.columnOptions = { ...columnMeta.columnOptions, ...columnOptions };
}

export function setColumnNullableTrue(entityName: string, columnName: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.nullable = true;
}

export function setColumnSynchronizedTrue(entityName: string, columnName: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.synchronized = true;
}

export function isColumnSynchronized(entityName: string, columnName: string): boolean {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  return columnMeta.synchronized === true;
}

export function toString(): string {
  return JSON.stringify(modelMeta, null, 2);
}

export function getSdl(): string {
  const sdlLines = [];

  Object.values(modelMeta.enums).forEach(({ name, values }) => {
    sdlLines.push(`enum ${name} {`);
    values.forEach((value) => sdlLines.push(`  ${value}`));
    sdlLines.push(`}\n`);
  });

  Object.values(modelMeta.entities).forEach(({ name, columns: fields }) => {
    sdlLines.push(`type ${name} {`);
    Object.values(fields).forEach((field) => sdlLines.push(getFieldSdlLine(field)));
    sdlLines.push("}\n");
  });

  return sdlLines.join("\n");
}

function getFieldSdlLine({ name, enumName, gqlType, nullable, directives }: IColumnMeta): string {
  const type = enumName ? enumName : gqlType;
  if (type == null) throw new Error(`orm.sdl.field.type.isNull: field "${name}"`);
  return `  ${name}: ${type}${nullable ? "" : "!"} ${directives ? directives.join(" ") : ""}`;
}
