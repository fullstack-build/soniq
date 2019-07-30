import { ExpressionCompiler, orderExpressions, ICompiledExpression } from "../expressions/ExpressionCompiler";
import { IParser, IParseReadFieldContext } from "../extensions/interfaces";
import { ITableData, IPermissionContext } from "../interfaces";
import { parseDirectives } from "../utils/parseDirectives";

import { CreateDefaultField } from "./defaultFieldCreator";
import { getQueryArguments } from "./getQueryArguments";
import { createGqlField, createView } from "./helpers";
import { IReadViewMeta, IReadView } from "./interfaces";

export function buildReadView(
  table: ITableData,
  readExpressions,
  permissionContext: IPermissionContext,
  extensions: IParser[],
  config,
  disableSecurityBarrier
): IReadView {
  // Get some data from table
  const { gqlTypeName, tableName, gqlTypeDefinition, schemaName } = table;

  // Initialize meta object. Required for querybuilder
  const meta: IReadViewMeta = {
    viewSchemaName: config.schemaName,
    publicViewName: `${tableName.toUpperCase()}_READ_PUBLIC`,
    authViewName: `${tableName.toUpperCase()}_READ_AUTH`,
    publicFieldNames: [],
    authFieldNames: [],
    fields: {},
    tableName,
    tableSchemaName: schemaName
  };

  // Create a copy of the current gqlDefinition and set fields to an empty array
  const newGqlDefinition = { ...JSON.parse(JSON.stringify(gqlTypeDefinition)), fields: [] };

  // List of field-select sql statements
  const publicFieldsSql = [];
  const authFieldsSql = [];

  // The hole view creation. Will be an array
  let publicViewSql = null;
  let authViewSql = null;

  const localTable = "_local_table_";

  // Create an instance of CreateExpression, to create several used expressions in the permissionContext of the current gqlType
  const expressionCreator = new ExpressionCompiler(permissionContext.expressions, localTable);
  const defaultFieldCreator = new CreateDefaultField(expressionCreator);

  gqlTypeDefinition.fields.forEach((gqlFieldDefinitionTemp) => {
    const gqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinitionTemp));
    const directives = parseDirectives(gqlFieldDefinition.directives);
    const fieldName = gqlFieldDefinition.name.value;

    const ctx: IParseReadFieldContext = {
      readExpressions,
      gqlFieldDefinition,
      directives,
      expressionCreator,
      defaultFieldCreator,
      fieldName,
      localTable,
      permissionContext, // TODO: Dustin: contect should have a parentContext or permissionContext
      getQueryArguments,
      table
    };

    extensions.some((parser) => {
      if (parser.parseReadField != null) {
        const results = parser.parseReadField(ctx);
        if (results != null && Array.isArray(results)) {
          results.forEach((result) => {
            if (result.gqlFieldDefinition != null) {
              newGqlDefinition.fields.push(result.gqlFieldDefinition);
            }
            const fieldData = {
              gqlFieldName: result.gqlFieldName,
              nativeFieldName: result.nativeFieldName,
              isVirtual: result.isVirtual === true,
              meta: result.meta
            };
            if (result.publicFieldSql != null) {
              publicFieldsSql.push(result.publicFieldSql);
              meta.publicFieldNames.push(result.gqlFieldName);
              if (result.authFieldSql == null) {
                authFieldsSql.push(result.publicFieldSql);
                meta.authFieldNames.push(result.gqlFieldName);
              }
            }
            if (result.authFieldSql != null) {
              authFieldsSql.push(result.authFieldSql);
              meta.authFieldNames.push(result.gqlFieldName);
            }
            meta.fields[result.gqlFieldName] = fieldData;
          });
          return true;
        }
      }
      return false;
    });
  });

  const compiledExpressions = expressionCreator.getCompiledExpressions();

  const authExpressions = Object.values(compiledExpressions).sort(orderExpressions);
  const publicExpressions = authExpressions.filter((compiledExpression) => {
    return compiledExpression.requiresAuth !== true;
  });

  authExpressions.forEach((compiledExpression) => {
    const gqlFieldDefinition = createGqlField(compiledExpression.name, compiledExpression.gqlReturnType);

    authFieldsSql.push(`"${compiledExpression.name}"."${compiledExpression.name}" AS "${compiledExpression.name}"`);
    meta.authFieldNames.push(compiledExpression.name);
    newGqlDefinition.fields.push(gqlFieldDefinition);

    meta.fields[compiledExpression.name] = {
      gqlFieldName: compiledExpression.name,
      nativeFieldName: compiledExpression.name,
      isVirtual: false,
      meta: null
    };
  });

  publicExpressions.forEach((compiledExpression) => {
    publicFieldsSql.push(`"${compiledExpression.name}"."${compiledExpression.name}" AS "${compiledExpression.name}"`);
    meta.publicFieldNames.push(compiledExpression.name);
  });

  if (meta.publicFieldNames.length > 0) {
    publicViewSql = createView(table, config, meta.publicViewName, publicFieldsSql, publicExpressions, disableSecurityBarrier);
    // If no view is created, no public fields exist
    if (publicViewSql == null) {
      meta.publicFieldNames = [];
    }
  }
  if (meta.authFieldNames.length > 0) {
    authViewSql = createView(table, config, meta.authViewName, authFieldsSql, authExpressions, disableSecurityBarrier);
  }

  return {
    meta,
    authViewSql,
    publicViewSql,
    gqlDefinition: newGqlDefinition
  };
}
