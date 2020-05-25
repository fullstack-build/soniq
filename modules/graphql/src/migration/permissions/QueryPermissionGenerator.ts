import { IDbSchema, IDbTable } from "../DbSchemaInterface";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler, ICompiledExpression } from "../ExpressionCompiler";
import { ExpressionGenerator } from "../ExpressionGenerator";
import { IColumnExtensionContext, IColumnExtension, IQueryFieldData } from "../columnExtensions/IColumnExtension";
import { getPgSelector, getPgRegClass } from "../helpers";
import { IQueryFieldMeta, IQueryPermissionGeneratorResult } from "../../RuntimeInterfaces";
import { LOCAL_TABLE_ALIAS } from "./PermissionsGenerator";
import { IGqlInputType, IGqlEnumType, IGqlType } from "./interfaces";

export class QueryPermissionGenerator {
  /* ===================================================================================

          ONLY HELPERS FROM HERE

  ==================================================================================== */

  private _createView(
    requiredComiledExpressions: ICompiledExpression[],
    requiredComiledWhereExpressions: ICompiledExpression[],
    viewName: string,
    selects: string[],
    schema: IDbSchema,
    table: IDbTable,
    whereCondition: string | null = null
  ): string {
    let sql: string = `CREATE VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(viewName)}${
      table.options != null && table.options.disableSecurityBarrierForReadViews === true
        ? ""
        : " WITH (security_barrier)"
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
  private _createSwitchCase(condition: string, columnRegClass: string, name: string): string {
    return `CASE WHEN ${condition} THEN ${columnRegClass} ELSE NULL END AS ${getPgSelector(name)}`;
  }
  private _generateGqlType(type: IGqlType): string {
    let def: string = `type ${type.name} {\n`;

    def += type.fields
      .map((field) => {
        return `  ${field}\n`;
      })
      .join("");

    def += "}\n";

    return def;
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
  private _generateGqlEnumType(type: IGqlEnumType): string {
    let def: string = `enum ${type.name} {\n`;

    def += type.options
      .map((option) => {
        return `  ${option}\n`;
      })
      .join("");

    def += "}\n";

    return def;
  }
  private _generateGqlQuery(
    queryName: string,
    filterName: string,
    orderByEnumName: string,
    tableTypeName: string
  ): string {
    let def: string = `extend type Query {\n`;

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
    const expressionGenerator: ExpressionGenerator = new ExpressionGenerator(expressionCompiler);
    const rootExpressionGenerator: ExpressionGenerator = new ExpressionGenerator(rootExpressionCompiler);

    const tableType: IGqlType = {
      name: `${table.name}`,
      fields: [],
    };

    const orderByEnum: IGqlEnumType = {
      name: `${table.name}OrderBy`,
      options: [],
    };

    const filterType: IGqlType = {
      name: `${table.name}Filter`,
      fields: [`AND: [${table.name}Filter!]`, `OR: [${table.name}Filter!]`],
    };

    const publicColumnSelects: string[] = [];
    const authColumnSelects: string[] = [];
    const rootColumnSelects: string[] = [];

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
        disallowGenericRootLevelAggregation:
          table.options != null && table.options.disallowGenericRootLevelAggregation === true,
      },
    };

    table.columns.forEach((column) => {
      // Remove this check because all columns are required for root access
      /* if (
        column.appliedQueryExpressionIds != null &&
        Array.isArray(column.appliedQueryExpressionIds) &&
        column.appliedQueryExpressionIds.length > 0
      ) { */
      const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);
      const columnExtensionContext: IColumnExtensionContext = {
        schema,
        table,
        column,
      };
      let authRequired: boolean = false;

      if (columnExtension == null) {
        throw new Error(`Colund not find columnExtension for type ${column.type} in columnId ${column.id}.`);
      }

      // Get field-data from the type
      const queryFieldData: IQueryFieldData = columnExtension.getQueryFieldData(
        columnExtensionContext,
        LOCAL_TABLE_ALIAS,
        (expressionId: string, addToRequiredList: boolean = false) => {
          const compiledExpression: ICompiledExpression = expressionGenerator.getCompiledExpressionById(
            expressionId,
            false,
            addToRequiredList
          );

          if (compiledExpression.authRequired === true) {
            authRequired = true;
          }

          return compiledExpression;
        },
        (expressionId: string, addToRequiredList: boolean = false) => {
          const compiledExpression: ICompiledExpression = rootExpressionGenerator.getCompiledExpressionById(
            expressionId,
            false,
            addToRequiredList
          );

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
        rootColumnSelects.push(
          `${queryFieldData.pgRootSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`
        );

        let hasPublicTrueExpression: unknown = false;

        const rootOnlyColumn: boolean =
          column.queryExpressionIds == null ||
          !Array.isArray(column.queryExpressionIds) ||
          column.queryExpressionIds.length <= 0;

        if (rootOnlyColumn !== true) {
          const compiledExpressions: ICompiledExpression[] = column.queryExpressionIds.map((expressionId) => {
            return expressionGenerator.getCompiledExpressionById(expressionId);
          });

          const publicCondition: string = compiledExpressions
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

          const authCondition: string = compiledExpressions
            .map((compiledExpression) => {
              return compiledExpression.alias;
            })
            .join(" OR ");

          // Push column to auth and public views dependent on auth-requirements
          if (hasPublicTrueExpression === true && authRequired === false) {
            publicColumnSelects.push(
              `${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`
            );
            authColumnSelects.push(
              `${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`
            );
          } else {
            if (publicCondition.length > 0 && authRequired === false) {
              publicColumnSelects.push(
                this._createSwitchCase(
                  publicCondition,
                  queryFieldData.pgSelectExpression,
                  queryFieldData.viewColumnName
                )
              );
            } else {
              publicColumnSelects.push(`NULL AS ${getPgSelector(queryFieldData.viewColumnName)}`);
            }
            if (hasPublicTrueExpression === true) {
              authColumnSelects.push(
                `${queryFieldData.pgSelectExpression} AS ${getPgSelector(queryFieldData.viewColumnName)}`
              );
            } else {
              authColumnSelects.push(
                this._createSwitchCase(authCondition, queryFieldData.pgSelectExpression, queryFieldData.viewColumnName)
              );
            }
          }
        }

        const queryFieldMeta: IQueryFieldMeta = {
          ...queryFieldData.queryFieldMeta,
          fieldName: queryFieldData.fieldName,
          columnName: queryFieldData.viewColumnName,
          columnSelectExpressionTemplate: queryFieldData.columnSelectExpressionTemplate,
          authRequired: authRequired && hasPublicTrueExpression !== true,
          rootOnlyColumn,
        };

        result.queryViewMeta.fields[queryFieldData.fieldName] = queryFieldMeta;
      }
      // }
    });

    // Build auth and public views
    const authRequiredCompiledExpressions: ICompiledExpression[] = expressionGenerator.getRequiredCompiledExpressions();
    const publicRequiredCompiledExpressions: ICompiledExpression[] = authRequiredCompiledExpressions.filter(
      (compiledExpression) => {
        return compiledExpression.authRequired !== true;
      }
    );

    const authWhereExpressions: ICompiledExpression[] = authRequiredCompiledExpressions.filter((compiledExpression) => {
      return compiledExpression.excludeFromWhereClause !== true && compiledExpression.directRequired === true;
    });
    const publicWhereExpressions: ICompiledExpression[] = publicRequiredCompiledExpressions.filter(
      (compiledExpression) => {
        return compiledExpression.excludeFromWhereClause !== true && compiledExpression.directRequired === true;
      }
    );

    if (authColumnSelects.length > 0) {
      const authViewSql: string = this._createView(
        authRequiredCompiledExpressions,
        authWhereExpressions,
        result.queryViewMeta.authViewName,
        authColumnSelects,
        schema,
        table
      );
      result.views.push({
        name: result.queryViewMeta.authViewName,
        sql: authViewSql,
      });
    }

    if (publicColumnSelects.length > 0) {
      const publicViewSql: string = this._createView(
        publicRequiredCompiledExpressions,
        publicWhereExpressions,
        result.queryViewMeta.publicViewName,
        publicColumnSelects,
        schema,
        table
      );
      result.views.push({
        name: result.queryViewMeta.publicViewName,
        sql: publicViewSql,
      });
    }

    // Build root view
    const rootViewSql: string = this._createView(
      [],
      [],
      result.queryViewMeta.rootViewName,
      rootColumnSelects,
      schema,
      table,
      "_auth.is_root() IS TRUE"
    );
    result.views.push({
      name: result.queryViewMeta.rootViewName,
      sql: rootViewSql,
    });

    const queryName: string = `${table.name}s`;

    if (tableType.fields.length > 0) {
      result.gqlTypeDefs += `${this._generateGqlType(tableType)}\n`;
    }
    if (filterType.fields.length > 0) {
      result.gqlTypeDefs += `${this._generateGqlInputType(filterType)}\n`;
    }
    if (orderByEnum.options.length > 0) {
      result.gqlTypeDefs += `${this._generateGqlEnumType(orderByEnum)}\n`;
    }
    if (tableType.fields.length > 0) {
      result.gqlTypeDefs += `${this._generateGqlQuery(queryName, filterType.name, orderByEnum.name, tableType.name)}\n`;
    }

    result.resolvers.push({
      path: `Query.${queryName}`,
      key: "@fullstack-one/graphql/queryResolver",
      config: {},
    });

    return result;
  }
}
