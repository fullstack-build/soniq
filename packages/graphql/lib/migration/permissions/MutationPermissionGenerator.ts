import { IDbSchema, IDbTable, IDbColumn, IDbMutation } from "../DbSchemaInterface";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler, ICompiledExpression } from "../ExpressionCompiler";
import { ExpressionGenerator } from "../ExpressionGenerator";
import { IColumnExtensionContext } from "../columnExtensions/IColumnExtension";
import { getPgSelector, getPgRegClass } from "../helpers";
import { IQueryFieldMeta, IMutationPermissionGeneratorResult, IMutationsMeta } from "../../RuntimeInterfaces";
import { LOCAL_TABLE_ALIAS } from "./PermissionsGenerator";

export class MutationPermissionGenerator {
  /* ===================================================================================

          ONLY HELPERS FROM HERE

  ==================================================================================== */
  private findColumnById(table: IDbTable, columnId: string): IDbColumn {
    for (const i in table.columns) {
      if (table.columns[i].id === columnId) {
        return table.columns[i];
      }
    }
    throw new Error(`Could not find column ${columnId}.`);
  }

  private createView(
    requiredComiledExpressions: ICompiledExpression[],
    requiredComiledWhereExpressions: ICompiledExpression[],
    viewName: string,
    selects: string[],
    withCheckOption: boolean,
    schema: IDbSchema,
    table: IDbTable
  ): string {
    let sql = `CREATE VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(viewName)} WITH (security_barrier) AS `;
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
  private generateGqlInputType(type: { name: string; fields: string[] }): string {
    let def = `input ${type.name} {\n`;

    def += type.fields
      .map((field) => {
        return `  ${field}\n`;
      })
      .join("");

    def += "}\n";

    return def;
  }
  private generateGqlMutation(mutationName: string, inputName: string, tableTypeName: string) {
    let def = `extend type Mutation {\n`;

    def += `  ${mutationName}(input: ${inputName}!, returnId: String): ${tableTypeName}!\n`;

    def += "}\n";

    return def;
  }
  public generate(schema: IDbSchema, table: IDbTable, helpers: IHelpers, expressionCompiler: ExpressionCompiler): IMutationsMeta {
    const mutationsMeta: IMutationsMeta = {
      views: [],
      gqlTypeDefs: "",
      resolvers: [],
      mutationViewMetas: []
    };

    const mutations = table.mutations || [];

    mutations.forEach((mutation) => {
      const result = this.generateMutation(schema, table, mutation, helpers, expressionCompiler);

      result.views.forEach((view) => {
        mutationsMeta.views.push(view);
      });
      result.resolvers.forEach((resolver) => {
        mutationsMeta.resolvers.push(resolver);
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
    const expressionGenerator = new ExpressionGenerator(expressionCompiler);

    const mutationName = `${mutation.type.toLowerCase()}${table.name}${mutation.type !== "DELETE" ? mutation.name : ""}`;
    const typeCamelCase = mutation.type.toLowerCase()[0].toUpperCase() + mutation.type.toLowerCase().substr(1);
    const viewName = `${table.name}_${typeCamelCase}${mutation.type !== "DELETE" ? "_" + mutation.name : ""}`;

    const mutationData: IMutationPermissionGeneratorResult = {
      views: [],
      gqlTypeDefs: "",
      resolvers: [],
      mutationViewMeta: {
        name: mutationName,
        type: mutation.type,
        authRequired: false,
        viewName,
        returnOnlyId: mutation.returnOnlyId === true
      }
    };

    const inputType = {
      name: mutationData.mutationViewMeta.viewName,
      fields: []
    };
    const selects = [];

    if (mutation.type === "CREATE" || mutation.type === "UPDATE") {
      let hasUpdateMutationIdColumn: any = false;

      mutation.columns.forEach((mutationColumn) => {
        const column = this.findColumnById(table, mutationColumn.columnId);
        const columnExtension = helpers.getColumnExtensionByType(column.type);
        const columnExtensionContext: IColumnExtensionContext = {
          schema,
          table,
          column
        };

        if (column.type === "id") {
          hasUpdateMutationIdColumn = true;
        }

        const pgColumnName = columnExtension.getPgColumnName(columnExtensionContext);

        const mutationFieldData = columnExtension.getMutationFieldData(columnExtensionContext, LOCAL_TABLE_ALIAS, mutation, mutationColumn);

        if (mutationFieldData != null && pgColumnName != null) {
          inputType.fields.push(`${pgColumnName}: ${mutationFieldData.fieldType}`);

          selects.push(`${getPgSelector(LOCAL_TABLE_ALIAS)}.${getPgSelector(pgColumnName)}`);
        }
      });

      if (mutation.type === "UPDATE" && hasUpdateMutationIdColumn !== true) {
        throw new Error(`Each UPDATE mutations needs an id column. See ${mutation.name}.`);
      }
    } else {
      inputType.fields.push(`id: ID!`);
    }

    const whereExpressions = mutation.appliedExpressionIds.map((appliedExpressionId) => {
      const compiledExpression = expressionGenerator.getCompiledExpressionById(appliedExpressionId);

      if (compiledExpression.authRequired === true) {
        mutationData.mutationViewMeta.authRequired = true;
      }

      return compiledExpression;
    });

    const viewSql = this.createView(
      expressionGenerator.getRequiredCompiledExpressions(),
      whereExpressions,
      inputType.name,
      selects,
      mutation.type !== "DELETE",
      schema,
      table
    );

    mutationData.views.push({
      name: inputType.name,
      sql: viewSql
    });

    mutationData.gqlTypeDefs += `${this.generateGqlInputType(inputType)}\n`;
    mutationData.gqlTypeDefs += `${this.generateGqlMutation(mutationName, inputType.name, table.name)}\n`;

    mutationData.resolvers.push({
      path: `Mutation.${mutationName}`,
      key: "@fullstack-one/graphql/mutationResolver",
      config: {}
    });

    return mutationData;
  }
}
