import { IDbSchema, IDbTable } from "../DbSchemaInterface";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler, ICompiledExpression } from "../ExpressionCompiler";
import { ExpressionGenerator } from "../ExpressionGenerator";
import { IColumnExtensionContext } from "../columnExtensions/IColumnExtension";
import { getPgSelector, getPgRegClass } from "../helpers";
import { IQueryFieldMeta, IQueryViewMeta, IQueryPermissionGeneratorResult } from "../../RuntimeInterfaces";
import { LOCAL_TABLE_ALIAS } from "./PermissionsGenerator";

export class QueryPermissionGenerator {
  /* ===================================================================================

          ONLY HELPERS FROM HERE

  ==================================================================================== */

  private createView(
    requiredComiledExpressions: ICompiledExpression[],
    requiredComiledWhereExpressions: ICompiledExpression[],
    viewName: string,
    selects: string[],
    schema: IDbSchema,
    table: IDbTable,
    whereCondition: string = null
  ): string {
    let sql = `CREATE VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(viewName)}${
      table.options != null && table.options.disableSecurityBarrierForReadViews === true ? "" : " WITH (security_barrier)"
    } AS `;
    sql += `SELECT ${selects.join(", ")} FROM ${getPgRegClass(table)} AS ${getPgSelector(LOCAL_TABLE_ALIAS)}`;

    if (requiredComiledExpressions.length > 0) {
      sql += `, ${requiredComiledExpressions
        .map((compiledExpression) => {
          return compiledExpression.sql;
        })
        .join(", ")}`;
    }

    if (whereCondition != null) {
      sql += ` WHERE ${whereCondition};`;
    } else {
      if (requiredComiledWhereExpressions.length > 0) {
        sql += ` WHERE (FALSE OR ${requiredComiledWhereExpressions
          .map((compiledExpression) => {
            return compiledExpression.alias;
          })
          .join(" OR ")});`;
      } else {
        // A view without any expression has nothing to see
        sql += ` WHERE FALSE;`;
      }
    }

    return sql;
  }
  private createSwitchCase(condition: string, columnRegClass: string, name: string) {
    return `CASE WHEN ${condition} THEN ${columnRegClass} ELSE NULL END AS ${getPgSelector(name)}`;
  }
  private generateGqlType(type: { name: string; fields: string[] }): string {
    let def = `type ${type.name} {\n`;

    def += type.fields
      .map((field) => {
        return `  ${field}\n`;
      })
      .join("");

    def += "}\n";

    return def;
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
  private generateGqlEnumType(type: { name: string; options: string[] }): string {
    let def = `enum ${type.name} {\n`;

    def += type.options
      .map((option) => {
        return `  ${option}\n`;
      })
      .join("");

    def += "}\n";

    return def;
  }
  private generateGqlQuery(queryName: string, filterName: string, orderByEnumName: string, tableTypeName: string) {
    let def = `extend type Query {\n`;

    def += `  ${queryName}(where: ${filterName}, orderBy: [${orderByEnumName}!], limit: Int, offset: Int): [${tableTypeName}!]!\n`;

    def += "}\n";

    return def;
  }
  public generate(
    schema: IDbSchema,
    table: IDbTable,
    helpers: IHelpers,
    expressionCompiler: ExpressionCompiler,
    rootExpressionCompiler: ExpressionCompiler
  ): IQueryPermissionGeneratorResult {
    const expressionGenerator = new ExpressionGenerator(expressionCompiler);
    const rootExpressionGenerator = new ExpressionGenerator(rootExpressionCompiler);

    const tableType = {
      name: `${table.name}`,
      fields: []
    };

    const orderByEnum = {
      name: `${table.name}OrderBy`,
      options: []
    };

    const filterType = {
      name: `${table.name}Filter`,
      fields: [`AND: [${table.name}Filter!]`, `OR: [${table.name}Filter!]`]
    };

    const publicColumnSelects = [];
    const authColumnSelects = [];
    const rootColumnSelects = [];

    const result: IQueryPermissionGeneratorResult = {
      views: [],
      gqlTypeDefs: "",
      resolvers: [],
      queryViewMeta: {
        name: table.name,
        publicViewName: `${table.name}_Read_Public`,
        authViewName: `${table.name}_Read_Auth`,
        rootViewName: `${table.name}_Root`,
        fields: {},
        disallowGenericRootLevelAggregation: table.options != null && table.options.disallowGenericRootLevelAggregation === true
      }
    };

    table.columns.forEach((column) => {
      // Remove this check because all columns are required for root access
      /* if (
        column.appliedQueryExpressionIds != null &&
        Array.isArray(column.appliedQueryExpressionIds) &&
        column.appliedQueryExpressionIds.length > 0
      ) { */
      const columnExtension = helpers.getColumnExtensionByType(column.type);
      const columnExtensionContext: IColumnExtensionContext = {
        schema,
        table,
        column
      };
      let authRequired: boolean = false;

      // Get field-data from the type
      const queryFieldData = columnExtension.getQueryFieldData(
        columnExtensionContext,
        LOCAL_TABLE_ALIAS,
        (expressionId: string, addToRequiredList: boolean = false) => {
          const compiledExpression = expressionGenerator.getCompiledExpressionById(expressionId, false, addToRequiredList);

          if (compiledExpression.authRequired === true) {
            authRequired = true;
          }

          return compiledExpression;
        },
        (expressionId: string, addToRequiredList: boolean = false) => {
          const compiledExpression = rootExpressionGenerator.getCompiledExpressionById(expressionId, false, addToRequiredList);

          return compiledExpression;
        }
      );

      // If this is null the column is not shown anywhere
      if (queryFieldData != null) {
        // GQL-Types generation

        // Add to table-type
        tableType.fields.push(queryFieldData.field);

        // Custom fields cannot be ordered or filtered
        if (queryFieldData.viewColumnName != null) {
          // Add to filter-type
          filterType.fields.push(`${queryFieldData.viewColumnName}: Operators`);

          // Add to orderByEnum if it can be ordered
          orderByEnum.options.push(`${queryFieldData.viewColumnName}_ASC`);
          orderByEnum.options.push(`${queryFieldData.viewColumnName}_DESC`);
        }

        if (queryFieldData.resolvers != null && Array.isArray(queryFieldData.resolvers)) {
          queryFieldData.resolvers.forEach((resolver) => {
            result.resolvers.push(resolver);
          });
        }

        if (queryFieldData.gqlTypeDefs != null) {
          result.gqlTypeDefs += queryFieldData.gqlTypeDefs;
        }

        // Push every column to root view
        rootColumnSelects.push(`${queryFieldData.pgRootSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`);

        let hasPublicTrueExpression: any = false;

        const rootOnlyColumn =
          column.queryExpressionIds == null || !Array.isArray(column.queryExpressionIds) || column.queryExpressionIds.length <= 0;

        if (rootOnlyColumn !== true) {
          const compiledExpressions = column.queryExpressionIds.map((expressionId) => {
            return expressionGenerator.getCompiledExpressionById(expressionId);
          });

          const publicCondition = compiledExpressions
            .filter((compiledExpression) => {
              if (compiledExpression.directBooleanResult === true) {
                hasPublicTrueExpression = true;
              }
              if (compiledExpression.authRequired === true) {
                authRequired = true;
              }

              return compiledExpression.authRequired !== true;
            })
            .map((compiledExpression) => {
              return compiledExpression.alias;
            })
            .join(" OR ");

          const authCondition = compiledExpressions
            .map((compiledExpression) => {
              return compiledExpression.alias;
            })
            .join(" OR ");

          // Push column to auth and public views dependent on auth-requirements
          if (hasPublicTrueExpression === true && authRequired === false) {
            publicColumnSelects.push(`${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`);
            authColumnSelects.push(`${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`);
          } else {
            if (publicCondition.length > 0 && authRequired === false) {
              publicColumnSelects.push(this.createSwitchCase(publicCondition, queryFieldData.pgSelectExpression, queryFieldData.viewColumnName));
            } else {
              publicColumnSelects.push(`NULL AS ${getPgSelector(queryFieldData.viewColumnName)}`);
            }
            if (hasPublicTrueExpression === true) {
              authColumnSelects.push(`${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`);
            } else {
              authColumnSelects.push(this.createSwitchCase(authCondition, queryFieldData.pgSelectExpression, queryFieldData.viewColumnName));
            }
          }
        }

        const queryFieldMeta: IQueryFieldMeta = {
          ...queryFieldData.queryFieldMeta,
          fieldName: queryFieldData.fieldName,
          columnName: queryFieldData.viewColumnName,
          columnSelectExpressionTemplate: queryFieldData.columnSelectExpressionTemplate,
          authRequired: authRequired && hasPublicTrueExpression !== true,
          rootOnlyColumn
        };

        result.queryViewMeta.fields[queryFieldData.fieldName] = queryFieldMeta;
      }
      // }
    });

    // Build auth and public views
    const authRequiredCompiledExpressions = expressionGenerator.getRequiredCompiledExpressions();
    const publicRequiredCompiledExpressions = authRequiredCompiledExpressions.filter((compiledExpression) => {
      return compiledExpression.authRequired !== true;
    });

    const authWhereExpressions = authRequiredCompiledExpressions.filter((compiledExpression) => {
      return compiledExpression.excludeFromWhereClause !== true && compiledExpression.directRequired === true;
    });
    const publicWhereExpressions = publicRequiredCompiledExpressions.filter((compiledExpression) => {
      return compiledExpression.excludeFromWhereClause !== true && compiledExpression.directRequired === true;
    });

    if (authColumnSelects.length > 0) {
      const authViewSql = this.createView(
        authRequiredCompiledExpressions,
        authWhereExpressions,
        result.queryViewMeta.authViewName,
        authColumnSelects,
        schema,
        table
      );
      result.views.push({
        name: result.queryViewMeta.authViewName,
        sql: authViewSql
      });
    }

    if (publicColumnSelects.length > 0) {
      const publicViewSql = this.createView(
        publicRequiredCompiledExpressions,
        publicWhereExpressions,
        result.queryViewMeta.publicViewName,
        publicColumnSelects,
        schema,
        table
      );
      result.views.push({
        name: result.queryViewMeta.publicViewName,
        sql: publicViewSql
      });
    }

    // Build root view
    const rootViewSql = this.createView([], [], result.queryViewMeta.rootViewName, rootColumnSelects, schema, table, "_auth.is_root() IS TRUE");
    result.views.push({
      name: result.queryViewMeta.rootViewName,
      sql: rootViewSql
    });

    const queryName = `${table.name}s`;

    if (tableType.fields.length > 0) {
      result.gqlTypeDefs += `${this.generateGqlType(tableType)}\n`;
    }
    if (filterType.fields.length > 0) {
      result.gqlTypeDefs += `${this.generateGqlInputType(filterType)}\n`;
    }
    if (orderByEnum.options.length > 0) {
      result.gqlTypeDefs += `${this.generateGqlEnumType(orderByEnum)}\n`;
    }
    if (tableType.fields.length > 0) {
      result.gqlTypeDefs += `${this.generateGqlQuery(queryName, filterType.name, orderByEnum.name, tableType.name)}\n`;
    }

    result.resolvers.push({
      path: `Query.${queryName}`,
      key: "@fullstack-one/graphql/queryResolver",
      config: {}
    });

    return result;
  }
}
