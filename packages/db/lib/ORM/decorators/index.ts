// tslint:disable:function-name
import "reflect-metadata";
import * as typeorm from "typeorm";
import * as ModelMeta from "./ModelMeta";

// TODO: build a createEntityDecorator function
export function Entity() {
  return (target: any) => {
    // <TFunction extends () => void>(target: TFunction): TFunction | void => {
    const entityName = target.name;
    const typeormDecorator = typeorm.Entity({ name: entityName });
    ModelMeta.addEntityMeta(entityName);
    console.log("Evaluate Entity Decorator");
    return typeormDecorator(target);
  };
  // return <TFunction extends () => void>(target: TFunction): TFunction | void => {
  //   ModelMeta.enhanceEntityMeta(name, { isTypeormEntity: true, decoratorTarget: target });
  //   return typeorm.Entity({ name })(target);
  // };
}

export function Column() {
  return (target: object, columnName: string | symbol): void => {
    const className = target.constructor.name;
    const columnOptions: typeorm.ColumnOptions = ModelMeta.getColumnOptions(className, String(columnName));
    console.log(`Evaluate Column ${String(columnName)} Decorator`);
    const typeormDecorator = typeorm.Column(columnOptions);
    typeormDecorator(target, columnName);
  };
}

// TODO: It would be cool if this is created with createColumnDecoratorFactory
export function gqlFieldType(type: ModelMeta.GqlFieldType) {
  return (target: object, propertyName: string | symbol): void => {
    const className = target.constructor.name;
    ModelMeta.enhanceColumnMeta(className, String(propertyName), { gqlType: type });
  };
}

export const pgType = {
  uuid: createColumnDecorator({ columnOptions: { type: "uuid" } }),
  string: createColumnDecorator({ columnOptions: { type: "character varying" } }),
  integer: createColumnDecorator({ columnOptions: { type: "integer" } }),
  decimal: createColumnDecorator({ columnOptions: { type: "decimal" } }),
  json: createColumnDecorator({ columnOptions: { type: "json" } }),
  boolean: createColumnDecorator({ columnOptions: { type: "boolean" } })
};

type TStrategy = "increment" | "rowid" | "uuid";

// TODO: Get rid of this bitch? use createColumnDecoratorFactory
export function PrimaryGeneratedColumn(strategy: TStrategy = "uuid") {
  const typeormDecorator = typeorm.PrimaryGeneratedColumn(strategy as any);
  return (target: object, propertyName: string | symbol) => {
    typeormDecorator(target, propertyName);

    const className = target.constructor.name;
    // GqlSdlMeta.addField(className, String(propertyName), "ID", false, decorators);
    ModelMeta.enhanceColumnMeta(className, String(propertyName), { gqlType: "ID" });
  };
}

type TColumnDecorator = (target: object, propertyName: string | symbol) => void;

export function createColumnDecorator({ directive, columnOptions }: { directive?: string; columnOptions?: typeorm.ColumnOptions }): TColumnDecorator {
  return (target: object, propertyName: string | symbol): void => {
    console.log(`Evaluate Directive "${directive}" Decorator`);
    const className = target.constructor.name;
    if (directive != null) ModelMeta.addColumnDirective(className, String(propertyName), directive);
    if (columnOptions != null) ModelMeta.addColumnOptions(className, String(propertyName), columnOptions);
  };
}

export function createColumnDecoratorFactory<TParams>({
  getDirective,
  getColumnOptions
}: {
  getDirective?: (params: TParams) => string;
  getColumnOptions?: (params: TParams) => typeorm.ColumnOptions;
}): (params: TParams) => TColumnDecorator {
  return (params: TParams): TColumnDecorator => {
    return (target: object, propertyName: string | symbol): void => {
      const className = target.constructor.name;
      if (getDirective != null) ModelMeta.addColumnDirective(className, String(propertyName), getDirective(params));
      if (getColumnOptions != null) ModelMeta.addColumnOptions(className, String(propertyName), getColumnOptions(params));
    };
  };
}
