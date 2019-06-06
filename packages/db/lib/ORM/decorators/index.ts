// tslint:disable:function-name
import "reflect-metadata";
import * as typeorm from "typeorm";
import * as GqlSdlMeta from "./ModelMeta";

// TODO: build a createEntityDecorator function
export function Entity(name?: string, options?: any) {
  const typeormDecorator = typeorm.Entity(name, options);
  return (originalConstructor) => {
    const className = originalConstructor.name;
    GqlSdlMeta.addEntityMeta(className);

    return typeormDecorator(originalConstructor);
  };
}

export function Column() {
  return (target: object, propertyName: string | symbol): void => {
    const className = target.constructor.name;
    GqlSdlMeta.enhanceColumnMeta(className, String(propertyName), { isTypeormColumn: true, decoratorTarget: target });
  };
}

// TODO: It would be cool if this is created with createColumnDecoratorFactory
export function gqlFieldType(type: GqlSdlMeta.GqlFieldType) {
  return (target: object, propertyName: string | symbol): void => {
    const className = target.constructor.name;
    GqlSdlMeta.enhanceColumnMeta(className, String(propertyName), { gqlType: type });
  };
}

type TStrategy = "increment" | "rowid" | "uuid";

// TODO: Get rid of this bitch? use createColumnDecoratorFactory
export function PrimaryGeneratedColumn(strategy: TStrategy = "uuid") {
  const typeormDecorator = typeorm.PrimaryGeneratedColumn(strategy as any);
  return (target: object, propertyName: string | symbol) => {
    typeormDecorator(target, propertyName);

    const className = target.constructor.name;
    // GqlSdlMeta.addField(className, String(propertyName), "ID", false, decorators);
    GqlSdlMeta.enhanceColumnMeta(className, String(propertyName), { gqlType: "ID", unique: true });
  };
}

type TColumnDecorator = (target: object, propertyName: string | symbol) => void;

export function createColumnDecorator({ directive, columnOptions }: { directive?: string; columnOptions?: typeorm.ColumnOptions }): TColumnDecorator {
  return (target: object, propertyName: string | symbol): void => {
    const className = target.constructor.name;
    if (directive != null) GqlSdlMeta.addColumnDirective(className, String(propertyName), directive);
    if (columnOptions != null) GqlSdlMeta.addColumnOptions(className, String(propertyName), columnOptions);
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
      if (getDirective != null) GqlSdlMeta.addColumnDirective(className, String(propertyName), getDirective(params));
      if (getColumnOptions != null) GqlSdlMeta.addColumnOptions(className, String(propertyName), getColumnOptions(params));
    };
  };
}
