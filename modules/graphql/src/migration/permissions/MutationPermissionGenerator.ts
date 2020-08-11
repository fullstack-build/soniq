import { IDbSchema, IDbTable, IDbColumn, IDbMutation } from "../DbSchemaInterface";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler, ICompiledExpression } from "../ExpressionCompiler";
import { ExpressionGenerator } from "../ExpressionGenerator";
import { IColumnExtensionContext, IColumnExtension, IMutationFieldData } from "../columnExtensions/IColumnExtension";
import { getPgSelector, getPgRegClass } from "../helpers";
import { IMutationPermissionGeneratorResult, IMutationsMeta } from "../../RuntimeInterfaces";
import { LOCAL_TABLE_ALIAS } from "./PermissionsGenerator";
import { IGqlInputType } from "./interfaces";

export class MutationPermissionGenerator {
  /* ===================================================================================

          ONLY HELPERS FROM HERE

  ==================================================================================== */
  private _findColumnById(table: IDbTable, columnId: string): IDbColumn {
    for (const column of table.columns) {
      if (column.id === columnId) {
        return column;
      }
    }
    throw new Error(`Could not find column ${columnId}.`);
  }

  private _createView(
    requiredComiledExpressions: ICompiledExpression[],
    requiredComiledWhereExpressions: ICompiledExpression[],
    viewName: string,
    selects: string[],
    withCheckOption: boolean,
    schema: IDbSchema,
    table: IDbTable
  ): string | null {
    let sql: string = `CREATE VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(
      viewName
    )} WITH (security_barrier) AS `;
    sql += `SELECT ${selects.join(", ")} FROM ${getPgRegClass(table)} AS ${getPgSelector(LOCAL_TABLE_ALIAS)}`;

    if (requiredComiledWhereExpressions.length > 0) {
      sql += ` WHERE (FALSE OR ${requiredComiledWhereExpressions
        .map((compiledExpression) => {
          return compiledExpression.renderedSql;
        })
        .join(" OR ")})`;
    } else {
      // A view without any expression makes no sense
      return null;
    }

    if (withCheckOption === true) {
      sql += " WITH CHECK OPTION;";
    } else {
      sql += ";";
    }

    return sql;
  }
  private _generateGqlInputType(type: IGqlInputType): string {
    let def: string = `input ${type.name} {\n`;

    def += type.fields
      .map((field) => {
        return `  ${field}\n`;
      })
      .join("");

    def += "}\n";

    return def;
  }
  private _generateGqlMutation(mutationName: string, inputName: string, tableTypeName: string): string {
    let def: string = `extend type Mutation {\n`;

    def += `  ${mutationName}(input: ${inputName}!, returnId: String): ${tableTypeName}!\n`;

    def += "}\n";

    return def;
  }
  public generate(
    schema: IDbSchema,
    table: IDbTable,
    helpers: IHelpers,
    expressionCompiler: ExpressionCompiler
  ): IMutationsMeta {
    const mutationsMeta: IMutationsMeta = {
      views: [],
      gqlTypeDefs: "",
      resolverMappings: [],
      mutationViewMetas: [],
    };

    const mutations: IDbMutation[] = table.mutations || [];

    mutations.forEach((mutation) => {
      const result: IMutationPermissionGeneratorResult = this.generateMutation(
        schema,
        table,
        mutation,
        helpers,
        expressionCompiler
      );

      result.views.forEach((view) => {
        mutationsMeta.views.push(view);
      });
      result.resolverMappings.forEach((resolverMapping) => {
        mutationsMeta.resolverMappings.push(resolverMapping);
      });

      mutationsMeta.mutationViewMetas.push(result.mutationViewMeta);
      mutationsMeta.gqlTypeDefs += `${result.gqlTypeDefs}\n`;
    });

    return mutationsMeta;
  }
  public generateMutation(
    schema: IDbSchema,
    table: IDbTable,
    mutation: IDbMutation,
    helpers: IHelpers,
    expressionCompiler: ExpressionCompiler
  ): IMutationPermissionGeneratorResult {
    const expressionGenerator: ExpressionGenerator = new ExpressionGenerator(expressionCompiler);

    const mutationName: string = `${mutation.type.toLowerCase()}${table.name}${
      mutation.type !== "DELETE" ? mutation.name : ""
    }`;
    const typeCamelCase: string = mutation.type.toLowerCase()[0].toUpperCase() + mutation.type.toLowerCase().substr(1);
    const viewName: string = `${table.name}_${typeCamelCase}${mutation.type !== "DELETE" ? "_" + mutation.name : ""}`;

    const mutationData: IMutationPermissionGeneratorResult = {
      views: [],
      gqlTypeDefs: "",
      resolverMappings: [],
      mutationViewMeta: {
        name: mutationName,
        type: mutation.type,
        authRequired: false,
        viewName,
        returnOnlyId: mutation.returnOnlyId === true || mutation.type === "DELETE",
      },
    };

    const inputType: IGqlInputType = {
      name: mutationData.mutationViewMeta.viewName,
      fields: [],
    };
    const selects: string[] = [];

    let hasUpdateMutationIdColumn: unknown = false;

    mutation.columns.forEach((mutationColumn) => {
      const column: IDbColumn = this._findColumnById(table, mutationColumn.columnId);
      const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);
      const columnExtensionContext: IColumnExtensionContext = {
        schema,
        table,
        column,
      };

      if (column.type === "id") {
        hasUpdateMutationIdColumn = true;
      }

      if (columnExtension == null) {
        throw new Error(`Could not find columnExtension for type ${column.type} in columnId ${column.id}`);
      }

      const pgColumnName: string | null = columnExtension.getPgColumnName(columnExtensionContext);

      const mutationFieldData: IMutationFieldData = columnExtension.getMutationFieldData(
        columnExtensionContext,
        LOCAL_TABLE_ALIAS,
        mutation,
        mutationColumn
      );

      if (mutationFieldData != null && pgColumnName != null) {
        inputType.fields.push(`${pgColumnName}: ${mutationFieldData.fieldType}`);

        selects.push(`${getPgSelector(LOCAL_TABLE_ALIAS)}.${getPgSelector(pgColumnName)}`);
      }
    });

    if (mutation.type === "UPDATE" && hasUpdateMutationIdColumn !== true) {
      throw new Error(`Each UPDATE mutation needs an id column. See ${mutation.name}.`);
    }
    if (mutation.type === "DELETE" && hasUpdateMutationIdColumn !== true) {
      throw new Error(`Each DELETE mutation needs an id column. See ${mutation.name}.`);
    }

    const whereExpressions: ICompiledExpression[] = mutation.expressionIds.map((expressionId) => {
      const compiledExpression: ICompiledExpression = expressionGenerator.getCompiledExpressionById(expressionId);

      if (compiledExpression.authRequired === true) {
        mutationData.mutationViewMeta.authRequired = true;
      }

      return compiledExpression;
    });

    const viewSql: string | null = this._createView(
      expressionGenerator.getRequiredCompiledExpressions(),
      whereExpressions,
      inputType.name,
      selects,
      mutation.type !== "DELETE",
      schema,
      table
    );

    if (viewSql != null) {
      mutationData.views.push({
        name: inputType.name,
        sql: viewSql,
      });
    }

    mutationData.gqlTypeDefs += `${this._generateGqlInputType(inputType)}\n`;
    mutationData.gqlTypeDefs += `${this._generateGqlMutation(
      mutationName,
      inputType.name,
      mutationData.mutationViewMeta.returnOnlyId ? "ID" : table.name
    )}\n`;

    mutationData.resolverMappings.push({
      path: `Mutation.${mutationName}`,
      key: "@fullstack-one/graphql/mutationResolver",
      config: {},
    });

    return mutationData;
  }
}
