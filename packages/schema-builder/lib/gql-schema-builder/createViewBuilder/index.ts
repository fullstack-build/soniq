import { ITableData, IPermissionContext } from "../interfaces";
import { CreateExpressions, orderExpressions } from "../createExpressions";
import { IParser, IParseCreateFieldContext } from "../extensions/interfaces";
import { parseDirectives } from "../utils/parseDirectives";

import { ICreateViewMeta, ICreateView } from "./interfaces";
import { createView } from "./helpers";

export function buildCreateView(table: ITableData, view, permissionContext: IPermissionContext, extensions: IParser[], config): ICreateView {
  // Get some data from table
  const { gqlTypeName, tableName, gqlTypeDefinition } = table;
  const sql = [];
  const mutationName = `${table.gqlTypeName}_CREATE_${view.name}`.toUpperCase();
  const gqlInputTypeName = mutationName;
  const returnOnlyId = view.returnOnlyId === true ? true : false;

  // Initialize meta object. Required for querybuilder
  const meta: ICreateViewMeta = {
    name: mutationName,
    viewSchemaName: config.schemaName,
    viewName: mutationName,
    type: "CREATE",
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
    const directives = parseDirectives(gqlFieldDefinition.directives);
    const fieldName = gqlFieldDefinition.name.value;
    gqlFieldDefinition.kind = "InputValueDefinition";

    const ctx: IParseCreateFieldContext = {
      view,
      gqlFieldDefinition,
      directives,
      fieldName,
      localTable,
      permissionContext,
      table
    };

    extensions.some((parser) => {
      if (parser.parseCreateField != null) {
        const gqlFieldDefinitions = parser.parseCreateField(ctx);
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

  return {
    gqlDefinitions: [newGqlTypeDefinition],
    meta,
    sql: viewSql
  };
}
