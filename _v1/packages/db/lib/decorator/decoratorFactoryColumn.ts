import { addColumnOptions, addColumnDirective, addColumnExtension, isColumnSynchronized, TColumnOptions } from "../model-meta";

type TColumnDecorator = (target: object, columnName: string) => void;

interface IOptions {
  directive?: string;
  columnOptions?: TColumnOptions;
  extension?: [string, any];
}

export function createColumnDecorator({ columnOptions, directive, extension }: IOptions): TColumnDecorator {
  return (target: object, columnName: string): void => {
    addOptions(target, columnName, columnOptions, directive, extension);
  };
}

interface IOptionGetters<TParams> {
  getColumnOptions?: (params: TParams) => TColumnOptions;
  getDirective?: (params: TParams) => string;
  getExtension?: (params: TParams) => [string, any];
}

export function createColumnDecoratorFactory<TParams>({
  getDirective,
  getColumnOptions,
  getExtension
}: IOptionGetters<TParams>): (params: TParams) => TColumnDecorator {
  return (params: TParams): TColumnDecorator => {
    return (target: object, columnName: string): void => {
      const columnOptions = getColumnOptions != null ? getColumnOptions(params) : null;
      const directive = getDirective != null ? getDirective(params) : null;
      const extension = getExtension != null ? getExtension(params) : null;
      addOptions(target, columnName, columnOptions, directive, extension);
    };
  };
}

function addOptions(
  target: object,
  columnName: string,
  columnOptions: TColumnOptions | null,
  directive: string | null,
  extension: [string, any] | null
): void {
  const entityName = target.constructor.name;
  if (isColumnSynchronized(entityName, columnName) === true) {
    // tslint:disable-next-line:no-console
    console.warn(
      `Some decorator for column "${entityName}"."${columnName}" is not applied
    after Column is synchronized. Please put your decorator below @Column to be evaluated first.`
    );
    return;
  }
  if (columnOptions != null) addColumnOptions(entityName, columnName, columnOptions);
  if (directive != null) addColumnDirective(entityName, columnName, directive);
  if (extension != null) addColumnExtension(entityName, columnName, extension);
}
