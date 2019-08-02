import { CreateExpressions, orderExpressions, IExpressionInput } from "../createExpressions";
import { parseDirectives } from "../utils/parseDirectives";

import { createView } from "./helpers";
import { ITableData, IPermissionContext } from "../interfaces";
import { IDeleteViewMeta, IDeleteView } from "./interfaces";
import { IParser } from "../extensions/interfaces";

export function buildDeleteView(
  table: ITableData,
  expressionsInput: IExpressionInput,
  permissionContext: IPermissionContext,
  extensions: IParser[],
  config
): IDeleteView {
  // Get some data from table
  const { gqlTypeName, tableName, gqlTypeDefinition } = table;
  const sql = [];
  // const mutationName = `${table.gqlTypeName}_DELETE`.toUpperCase();
  const mutationName = `delete${gqlTypeName}`;
  const gqlInputTypeName = mutationName;

  // Initialize meta object. Required for querybuilder
  const meta: IDeleteViewMeta = {
    name: mutationName,
    viewSchemaName: config.schemaName,
    viewName: mutationName,
    type: "DELETE",
    requiresAuth: false,
    gqlTypeName,
    gqlReturnTypeName: "ID",
    extensions: {},
    gqlInputTypeName
  };

  // Create a copy of the current gqlDefinition and set fields to an empty array
  const newGqlTypeDefinition = JSON.parse(JSON.stringify(gqlTypeDefinition));
  newGqlTypeDefinition.fields = [
    {
      kind: "InputValueDefinition",
      name: {
        kind: "Name",
        value: "id"
      },
      type: {
        kind: "NonNullType",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "ID"
          }
        }
      },
      defaultValue: null,
      directives: []
    }
  ];
  newGqlTypeDefinition.name.value = gqlInputTypeName;
  newGqlTypeDefinition.kind = "InputObjectTypeDefinition";

  const localTable = "_local_table_";

  // Create an instance of CreateExpression, to create several used expressions in the permissionContext of the current gqlType
  const expressionCreator = new CreateExpressions(permissionContext.expressions, localTable, true);

  expressionCreator.parseExpressionInput(expressionsInput, true);

  const compiledExpressions = expressionCreator.getCompiledExpressions();

  const expressions = Object.values(compiledExpressions).sort(orderExpressions);

  expressions.forEach((expression: any) => {
    meta.requiresAuth = expression.requiresAuth === true ? true : meta.requiresAuth;
  });

  const viewSql = createView(table, config, mutationName, expressions);

  if (meta.requiresAuth !== true) {
    throw new Error(
      `Due to security reasons it is not allowed to create DELETE permissions without auth expressions. Look at the permission for type '${gqlTypeName}'.`
    );
  }

  return {
    gqlDefinitions: [newGqlTypeDefinition],
    meta,
    sql: viewSql
  };
}
