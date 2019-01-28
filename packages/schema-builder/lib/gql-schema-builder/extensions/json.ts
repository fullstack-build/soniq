import { getJsonObjectBuilderExpression } from "../utils";
import * as _ from "lodash";
import { IParseReadFieldContext } from "../interfaces";

const JSON_SPLIT = ".";

function createJsonSubset(expressions, columnExpression) {
  let publicSql = null;
  let authSql = null;

  let hasPublicTrueExpression: any = false;

  const getName = (expressionObject) => {
    return `"${expressionObject.name}"."${expressionObject.name}"`;
  };

  // Generate public condition out of array of expressions
  const publicCondition = expressions
    .filter((expressionObject) => {
      // If any expression is just true, the hole field is public
      if (expressionObject.sql.toLowerCase() === "true") {
        hasPublicTrueExpression = true;
      }

      return expressionObject.requiresAuth !== true;
    })
    .map(getName)
    .join(" OR ");

  // Generate condition out of array of expressions
  const authCondition = expressions.map(getName).join(" OR ");

  // If one expression is just true we don't need CASE (for public fields)
  if (hasPublicTrueExpression === true) {
    publicSql = `${columnExpression}`;
  } else {
    if (publicCondition !== "") {
      publicSql = `CASE WHEN ${publicCondition} THEN ${columnExpression} ELSE jsonb_build_object() END`;
    }
    authSql = `CASE WHEN ${authCondition} THEN ${columnExpression} ELSE jsonb_build_object() END`;
  }
  return {
    publicSql,
    authSql
  };
}

function getJsonMerge(jsonFields) {
  if (jsonFields.length < 1) {
    return "jsonb_build_object()";
  }
  if (jsonFields.length < 2) {
    return jsonFields.pop();
  }
  const jsonField = jsonFields.pop();

  return `_meta.jsonb_merge(${jsonField}, ${getJsonMerge(jsonFields)})`;
}

export function parseReadField(ctx: IParseReadFieldContext) {
  const { fieldName, readExpressions, directives, expressionCreator, localTable, gqlFieldDefinition } = ctx;

  // Is this a json field
  if (directives.json == null) {
    return null;
  }

  // Find all fields for this json defined in permission
  const jsonFieldKeys = Object.keys(readExpressions).filter((key) => {
    return key.split(".")[0] === fieldName;
  });

  // If nothing found it no one can view it
  if (jsonFieldKeys.length < 1) {
    return null;
  }

  const sameExpressionSets = {};

  // If some json field permission have the same expression-set we can merge them before.
  jsonFieldKeys.forEach((key) => {
    const readExpressionsField = readExpressions[key];
    const expressionKey = JSON.stringify(readExpressionsField);
    if (sameExpressionSets[expressionKey] == null) {
      sameExpressionSets[expressionKey] = {
        matchObject: {},
        permissionExpressions: expressionCreator.parseExpressionInput(readExpressionsField, true)
      };
    }
    _.set(sameExpressionSets[expressionKey].matchObject, key, true);
  });

  const publicJsonSubsets = [];
  const authJsonSubsets = [];

  Object.values(sameExpressionSets).forEach((expressionSet: any) => {
    const jsonExpression = getJsonObjectBuilderExpression(expressionSet.matchObject, fieldName, localTable);
    const { publicSql, authSql } = createJsonSubset(expressionSet.permissionExpressions, jsonExpression);
    if (publicSql != null) {
      publicJsonSubsets.push(publicSql);
      if (authSql == null) {
        authJsonSubsets.push(publicSql);
      }
    }
    if (authSql != null) {
      authJsonSubsets.push(authSql);
    }
  });

  let publicFieldSql = null;
  let authFieldSql = null;

  if (publicJsonSubsets.length > 0) {
    publicFieldSql = `${getJsonMerge(publicJsonSubsets)} AS "${fieldName}"`;
  }

  if (authJsonSubsets.length > 0) {
    authFieldSql = `${getJsonMerge(authJsonSubsets)} AS "${fieldName}"`;
  }

  return [
    {
      gqlFieldName: fieldName,
      nativeFieldName: fieldName,
      publicFieldSql,
      authFieldSql,
      gqlFieldDefinition
    }
  ];
}

export function parseUpdateField(ctx) {
  const { gqlFieldDefinition, view, fieldName, directives } = ctx;

  if (view.fields.indexOf(fieldName) >= 0 && directives.json != null) {
    gqlFieldDefinition.type = renameNamedTypeToInput(gqlFieldDefinition.type);
    return [gqlFieldDefinition];
  }
  return null;
}

export function parseCreateField(ctx) {
  return parseUpdateField(ctx);
}

function renameNamedTypeToInput(gqlType) {
  if (gqlType.kind === "NamedType") {
    gqlType.name.value = `${gqlType.name.value}Input`;
  } else {
    gqlType.type = renameNamedTypeToInput(gqlType.type);
  }
  return gqlType;
}
