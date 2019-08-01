import { createColumnDecoratorFactory, Connection, EntitySubscriberInterface, EventSubscriber, LoadEvent } from "@fullstack-one/db";
import { expressions } from "../gql-schema-builder/expressions/defineExpression";
import { ExpressionCompiler } from "../gql-schema-builder/expressions/ExpressionCompiler";

interface IOptions<TParams = any> {
  name: string;
  params?: TParams;
  gqlType: string;
}

interface IObjectLiteral {
  [key: string]: any;
}

const resolveComputedColumnPrefix = "_resolve_computed_";

@EventSubscriber()
export class AfterLoadForComputedColumnsSubscriber implements EntitySubscriberInterface {
  public afterLoad(entity: IObjectLiteral, event: LoadEvent<IObjectLiteral>): Promise<any> {
    const resolveComputedFns = getResolveComputedFns(entity);
    const promises = resolveComputedFns.map((fn) => fn(entity, event.connection));
    return Promise.all(promises);
  }
}

function getResolveComputedFns(entity: IObjectLiteral): Array<(entity: IObjectLiteral, connection: Connection) => Promise<void>> {
  return Object.entries(entity.constructor)
    .filter(([key]) => key.startsWith(resolveComputedColumnPrefix))
    .map(([key, value]) => value as (entity: IObjectLiteral) => Promise<void>);
}

// tslint:disable-next-line:function-name
export function Computed(options: IOptions) {
  const directiveDecorator = createColumnDecoratorFactory<IOptions>({
    getDirective: ({ name, params }) => {
      if (params == null) return `@computed(expression: "${name}")`;
      return `@computed(expression: "${name}", params: ${JSON.stringify(params)})`;
    },
    getColumnOptions: ({ gqlType }) => ({ gqlType })
  })(options);

  return (target: any, columnName: string): void => {
    directiveDecorator(target, columnName);

    const tableName = target.constructor.name;
    const afterLoadFnName = `${resolveComputedColumnPrefix}${columnName}`;
    target.constructor[afterLoadFnName] = (entity: IObjectLiteral, connection: Connection) => {
      if (entity[columnName] == null) {
        entity[columnName] = async () => {
          const expressionCompiler = new ExpressionCompiler(expressions, "_local_table_", true);
          const compiledExpression = expressionCompiler.parseExpressionInput([{ name: options.name, params: options.params }])[0];
          const sql = `SELECT (${compiledExpression.sql}) "result" FROM "${"public"}"."${tableName}" AS "_local_table_";`;
          const [{ result }] = await connection.query(sql);
          return result;
        };
      }
    };
  };
}
