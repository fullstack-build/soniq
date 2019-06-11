import * as typeorm from "typeorm";

export type GqlFieldType = "String" | "Int" | "Float" | "Boolean" | "JSON" | "ID";

export interface IColumnMeta {
  name?: string;
  gqlType?: GqlFieldType | string;
  isTypeormPrimaryGeneratedColumn?: boolean;
  directives?: string[];
  columnOptions?: typeorm.ColumnOptions;
  synchronized?: boolean;
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

interface IModelMeta {
  entities: {
    [entityName: string]: IEntityMeta;
  };
}

const modelMeta: IModelMeta = {
  entities: {}
};

function createEntityMetaIfNotExists(entityName: string): IEntityMeta {
  if (modelMeta.entities[entityName] == null) {
    modelMeta.entities[entityName] = {
      name: entityName,
      columns: {},
      synchronized: false
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
      synchronized: false
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
  return columnMeta.columnOptions;
}

export function setColumnGqlType(entityName: string, columnName: string, gqlType: GqlFieldType | string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.gqlType = gqlType;
}

export function addColumnDirective(entityName: string, columnName: string, directive: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.directives.push(directive);
}

export function addColumnOptions(entityName: string, columnName: string, columnOptions: typeorm.ColumnOptions): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.columnOptions = { ...columnMeta.columnOptions, ...columnOptions };
}

export function setColumnSynchronizedTrue(entityName: string, columnName: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.synchronized = true;
}

export function isColumnSynchronized(entityName: string, columnName: string): boolean {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  return columnMeta.synchronized === true;
}

// export function synchronizeDatabase(): void {
//   Object.values(modelMeta.entities).forEach((entityMeta) => {
//     Object.values(entityMeta.columns).forEach((columnMeta) => {
//       if (columnMeta.isTypeormColumn && columnMeta.decoratorTarget != null) {
//         const typeormDecorator = typeorm.Column(columnMeta.columnOptions);
//         console.log("Return Column");
//         typeormDecorator(columnMeta.decoratorTarget, columnMeta.name);
//       }
//     });
//     // if (entityMeta.isTypeormEntity && entityMeta.decoratorTarget != null) {
//     //   const typeormDecorator = typeorm.Entity({ name: entityMeta.name });
//     //   typeormDecorator(entityMeta.decoratorTarget);
//     // }
//   });
// }

export function toString(): string {
  return JSON.stringify(modelMeta, null, 2);
}

export function getSdl(): string {
  const sdlLines = [];

  Object.values(modelMeta.entities).forEach(({ name, columns: fields }) => {
    sdlLines.push(`type ${name} {`);
    Object.values(fields).forEach((field) => sdlLines.push(getFieldSdlLine(field)));
    sdlLines.push("}\n");
  });

  return sdlLines.join("\n");
}

function getFieldSdlLine({ name, gqlType: type, directives }: IColumnMeta): string {
  return `  ${name}: ${type} ${directives ? directives.join(" ") : ""}`;
}
