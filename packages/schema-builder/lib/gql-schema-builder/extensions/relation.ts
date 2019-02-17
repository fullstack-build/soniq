import { createIdArrayField, createIdField, getRelationMetasFromDefinition } from "../utils";
import * as _ from "lodash";
import { IParseReadFieldContext, IParseUpdateFieldContext } from "../extensions.new/interfaces";

function getRelations(dbMeta, relationName, tableName) {
  const relationConnections = dbMeta.relations[relationName];

  const relationConnectionsArray: any = Object.values(relationConnections);

  const isFirstRelation = relationConnectionsArray[0].tableName === tableName;

  // Determine which relation is the foreign one to get the correct columnName
  const foreignRelation = isFirstRelation !== true ? relationConnectionsArray[0] : relationConnectionsArray[1];

  // Determine which relation is the own one to get the correct columnName
  const ownRelation = isFirstRelation === true ? relationConnectionsArray[0] : relationConnectionsArray[1];

  return {
    ownRelation,
    foreignRelation
  };
}

export function parseReadField(ctx: IParseReadFieldContext) {
  const { fieldName, readExpressions, directives } = ctx;

  // Has field any permission-expression - without at least one expression it is not queryable at all
  if (directives.relation != null && directives.relation.name != null && readExpressions[fieldName] != null) {
    const { gqlFieldDefinition, localTable, defaultFieldCreator, table, getQueryArguments, permissionContext } = ctx;
    let newGqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinition));

    let publicFieldSql = null;
    let authFieldSql = null;
    let nativeFieldName = null;

    const { foreignGqlTypeName, isListType, isNonNullType } = getRelationMetasFromDefinition(gqlFieldDefinition);

    const { ownRelation, foreignRelation } = getRelations(permissionContext.dbMeta, directives.relation.name, table.tableName);

    const meta = {
      foreignGqlTypeName,
      isListType,
      isNonNullType,
      relationName: directives.relation.name,
      table: {
        gqlTypeName: table.gqlTypeName,
        schemaName: table.schemaName,
        tableName: table.tableName
      }
    };

    if (meta.isListType !== true) {
      nativeFieldName = ownRelation.columnName;

      const columnExpression = `"${localTable}"."${nativeFieldName}"`;

      const result = defaultFieldCreator.create(readExpressions[fieldName], newGqlFieldDefinition, columnExpression, nativeFieldName);

      if (result.publicFieldSql != null) {
        publicFieldSql = result.publicFieldSql;
      }
      if (result.authFieldSql != null) {
        authFieldSql = result.authFieldSql;
      }
      if (result.gqlFieldDefinition != null) {
        newGqlFieldDefinition = result.gqlFieldDefinition;
      }
    } else {
      newGqlFieldDefinition.arguments = getQueryArguments(foreignGqlTypeName);
    }

    return [
      {
        gqlFieldName: fieldName,
        nativeFieldName,
        publicFieldSql,
        authFieldSql,
        gqlFieldDefinition: newGqlFieldDefinition,
        meta
      }
    ];
  }
  return null;
}

export function parseUpdateField(ctx: IParseUpdateFieldContext) {
  const { view, fieldName, directives } = ctx;

  if (view.fields.indexOf(fieldName) >= 0 && directives.relation != null && directives.relation.name != null) {
    const { gqlFieldDefinition, table, permissionContext } = ctx;

    const { foreignGqlTypeName, isListType, isNonNullType } = getRelationMetasFromDefinition(gqlFieldDefinition);

    const { ownRelation, foreignRelation } = getRelations(permissionContext.dbMeta, directives.relation.name, table.tableName);

    if (ownRelation.columnName != null) {
      if (foreignRelation != null && foreignRelation.type === "MANY" && ownRelation.type === "MANY") {
        // In case of ManyToMany it's an array
        return [createIdArrayField(ownRelation.columnName, isNonNullType)];
      } else {
        // In case of ManyToOne it is an id
        return [createIdField(ownRelation.columnName, isNonNullType)];
      }
    }
    return [];
  }
  return null;
}

export function parseCreateField(ctx) {
  return parseUpdateField(ctx);
}
