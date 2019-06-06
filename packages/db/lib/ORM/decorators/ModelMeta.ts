import * as typeorm from "typeorm";

export type GqlFieldType = "String" | "Int" | "Float" | "Boolean" | "JSON" | "ID";

export interface IColumnMeta {
  name?: string;
  gqlType?: GqlFieldType;
  isTypeormColumn?: boolean;
  isTypeormPrimaryGeneratedColumn?: boolean;
  decoratorTarget?: object;
  directives?: string[];
  columnOptions?: typeorm.ColumnOptions;
}

export interface IEntityMeta {
  name: string;
  columns: {
    [columnName: string]: IColumnMeta;
  };
  isTypeormEntity?: boolean;
  decoratorTarget?: object;
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
      columns: {}
    };
  }
  return modelMeta.entities[entityName];
}

function createColumnMetaIfNotExists(entityName: string, columnName: string): IColumnMeta {
  const entitiyMeta = createEntityMetaIfNotExists(entityName);
  if (entitiyMeta.columns[columnName] == null) {
    entitiyMeta.columns[columnName] = {
      name: columnName,
      directives: []
    };
  }
  return entitiyMeta.columns[columnName];
}

export function addEntityMeta(entityName: string): void {
  createEntityMetaIfNotExists(entityName);
}

export function enhanceColumnMeta(entityName: string, columnName: string, columnMeta: IColumnMeta): void {
  const currentColumnMeta = createColumnMetaIfNotExists(entityName, columnName);
  modelMeta.entities[entityName].columns[columnName] = { name: columnName, ...currentColumnMeta, ...columnMeta };
}

export function addColumnDirective(entityName: string, columnName: string, directive: string): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.directives.push(directive);
}

export function addColumnOptions(entityName: string, columnName: string, columnOptions: typeorm.ColumnOptions): void {
  const columnMeta = createColumnMetaIfNotExists(entityName, columnName);
  columnMeta.columnOptions = { ...columnMeta.columnOptions, ...columnOptions };
}

export function synchronizeDatabase(): void {
  Object.values(modelMeta.entities).forEach((entityMeta) => {
    Object.values(entityMeta.columns).forEach((columnMeta) => {
      if (columnMeta.isTypeormColumn && columnMeta.decoratorTarget != null) {
        const typeormDecorator = typeorm.Column(columnMeta.columnOptions);
        typeormDecorator(columnMeta.decoratorTarget, columnMeta.name);
      }
    });
    if (entityMeta.isTypeormEntity && entityMeta.decoratorTarget != null) {
      const typeormDecorator = typeorm.Entity();
      typeormDecorator(entityMeta.decoratorTarget, entityMeta.name);
    }
  });
}

export function logModelMeta(): void {
  console.log(JSON.stringify(modelMeta, null, 2));
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
