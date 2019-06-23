import { CreateExpressions, orderExpressions } from "../createExpressions";
import { parseDirectives } from "../utils/parseDirectives";

import { createView } from "./helpers";
import { IUpdateViewMeta, IUpdateView } from "./interfaces";
import { ITableData, IPermissionContext, IMutationView } from "../interfaces";
import { IParser, IParseUpdateFieldContext } from "../extensions/interfaces";

export function buildUpdateView(
  table: ITableData,
  view: IMutationView<any>,
  permissionContext: IPermissionContext,
  extensions: IParser[],
  config
): IUpdateView {
  // Get some data from table
  const { gqlTypeName, tableName, gqlTypeDefinition } = table;
  const sql = [];
  const mutationName = `${table.gqlTypeName}_UPDATE_${view.name}`.toUpperCase();
  const gqlInputTypeName = mutationName;
  const returnOnlyId = view.returnOnlyId === true;

  // Initialize meta object. Required for querybuilder
  const meta: IUpdateViewMeta = {
    name: mutationName,
    viewSchemaName: config.schemaName,
    viewName: mutationName,
    type: "UPDATE",
    requiresAuth: false,
    gqlTypeName,
    gqlReturnTypeName: returnOnlyId === true ? "ID" : gqlTypeName,
    extensions: {},
    gqlInputTypeName
  };

  // Create a copy of the current gqlDefinition and set fields to an empty array
  const newGqlTypeDefinition = JSON.parse(JSON.stringify(gqlTypeDefinition));
  newGqlTypeDefinition.fields = [];
  newGqlTypeDefinition.name.value = gqlInputTypeName;
  newGqlTypeDefinition.kind = "InputObjectTypeDefinition";

  if (returnOnlyId === true) {
    newGqlTypeDefinition.type = {
      kind: "NonNullType",
      type: {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: "ID"
        }
      }
    };
  }

  // List of field-select sql statements
  const fieldsSql = [];

  const localTable = "_local_table_";

  gqlTypeDefinition.fields.forEach((gqlFieldDefinitionTemp) => {
    const gqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinitionTemp));

    // Remove the NonNullType for all fields.
    if (gqlFieldDefinition.type.kind === "NonNullType") {
      gqlFieldDefinition.type = gqlFieldDefinition.type.type;
    }

    const directives = parseDirectives(gqlFieldDefinition.directives);
    const fieldName = gqlFieldDefinition.name.value;
    gqlFieldDefinition.kind = "InputValueDefinition";

    const ctx: IParseUpdateFieldContext = {
      directives,
      fieldName,
      gqlFieldDefinition,
      localTable,
      permissionContext,
      table,
      view
    };

    extensions.some((parser) => {
      if (parser.parseUpdateField != null) {
        const gqlFieldDefinitions = parser.parseUpdateField(ctx);
        if (gqlFieldDefinitions != null && Array.isArray(gqlFieldDefinitions)) {
          gqlFieldDefinitions.forEach((newGqlFieldDefinition) => {
            newGqlTypeDefinition.fields.push(newGqlFieldDefinition);
            fieldsSql.push(`"${localTable}"."${newGqlFieldDefinition.name.value}"`);
          });
          return true;
        }
      }
      return false;
    });
  });

  // Create an instance of CreateExpression, to create several used expressions in the context of the current gqlType
  const expressionCreator = new CreateExpressions(permissionContext.expressions, localTable, true);

  expressionCreator.parseExpressionInput(view.expressions, true);

  const compiledExpressions = expressionCreator.getCompiledExpressions();

  const expressions = Object.values(compiledExpressions).sort(orderExpressions);

  expressions.forEach((expression: any) => {
    meta.requiresAuth = expression.requiresAuth === true ? true : meta.requiresAuth;
  });

  const viewSql = createView(table, config, mutationName, fieldsSql, expressions);

  if (meta.requiresAuth !== true) {
    throw new Error(
      "Due to security reasons it is not allowed to create UPDATE permissions " +
        `without auth expressions. Look at the permission for type '${gqlTypeName}'.`
    );
  }

  return {
    gqlDefinitions: [newGqlTypeDefinition],
    meta,
    sql: viewSql
  };
}
