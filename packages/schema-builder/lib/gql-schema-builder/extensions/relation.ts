import findDirectiveIndex from '../utils/findDirectiveIndex';
import getArgumentByName from '../utils/getArgumentByName';
import getRelationForeignGqlTypeName from '../utils/getRelationForeignGqlTypeName';
import { getRelationMetasFromDefinition } from '../utils/getRelationMetasFromDefinition';
import createIdArrayField from '../utils/createIdArrayField';
import createIdField from '../utils/createIdField';
import {
  _
} from 'lodash';

export function parseField(field, ctx) {
  const fieldName = field.name.value;
  const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;

  if (!isIncluded) {
    return false;
  }

  const relationDirectiveIndex = findDirectiveIndex(field, 'relation');

  // field is relation
  if (relationDirectiveIndex < 0) {
    return false;
  }
  const relationDirective = field.directives[relationDirectiveIndex];
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const tableName = ctx.view.tableName;

  if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
    ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
  }

  const relationName = getArgumentByName(relationDirective, 'name').value.value;

  const relationConnections = ctx.dbObject.relations[relationName];

  const relationConnectionsArray: any = Object.values(relationConnections);

  // Determine which relation is the foreign one to get the correct columnName
  const foreignRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[1] : relationConnectionsArray[0];

  // Determine which relation is the own one to get the correct columnName
  const ownRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[0] : relationConnectionsArray[1];

  const relationFieldName = fieldName + 'Id';

  const foreignGqlTypeName = getRelationForeignGqlTypeName(field);
  const foreignNativeTable = ctx.dbObject.exposedNames[foreignGqlTypeName];
  if (foreignNativeTable == null) {
    throw new Error(`Unable to find database table for name GraphQL type name '${foreignGqlTypeName}'.`);
  }

  ctx.gQlTypes[gqlTypeName].relationByField[fieldName] = {
    relationName,
    foreignGqlTypeName,
    foreignTableName: foreignNativeTable.tableName,
    foreignSchemaName: foreignNativeTable.schemaName,
    relationType: ownRelation.type,
    columnName: relationFieldName
  };

  if (ownRelation.columnName != null) {
    ctx.dbView.fields.push({
      name: fieldName,
      expression: `"${ownRelation.columnName}"`
    });

    if (ctx.view.type !== 'READ') {
      // Add relation-field-name to GQL Input for mutating it
      if (foreignRelation.type === 'MANY' && ownRelation.type === 'MANY') {
        // In case of ManyToMany it's an array
        ctx.tableView.fields.push(createIdArrayField(ownRelation.columnName));
      } else {
        // In case of ManyToOne it is an id
        ctx.tableView.fields.push(createIdField(ownRelation.columnName));
      }
    }

    if (ctx.gQlTypes[gqlTypeName].nativeFieldNames.indexOf(ownRelation.columnName) < 0) {
      ctx.gQlTypes[gqlTypeName].nativeFieldNames.push(ownRelation.columnName);
    }

    ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(ownRelation.columnName);
  }

  // This field cannot be set with a mutation
  if (ctx.view.type === 'READ') {
    const foreignTypesEnumName = (foreignNativeTable.tableName + '_VIEWS').toUpperCase();
    field.arguments = ctx.getQueryArguments(foreignTypesEnumName, foreignGqlTypeName);
    ctx.tableView.fields.push(field);
  }
  return true;
}

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

export function parseReadField(ctx) {
  const { fieldName, readExpressions, directives } = ctx;

  // Has field any permission-expression
  if (directives.relation != null && directives.relation.name != null && readExpressions[fieldName] != null) {
    const { gqlFieldDefinition, localTable, defaultFieldCreator, table, getQueryArguments, context } = ctx;
    let newGqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinition));

    let publicFieldSql = null;
    let authFieldSql = null;
    let nativeFieldName = null;

    const { foreignGqlTypeName, isListType, isNonNullType } = getRelationMetasFromDefinition(gqlFieldDefinition);

    const { ownRelation, foreignRelation } = getRelations(context.dbMeta, directives.relation.name, table.tableName);

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

    return [{
        gqlFieldName: fieldName,
        nativeFieldName,
        publicFieldSql,
        authFieldSql,
        gqlFieldDefinition: newGqlFieldDefinition,
        meta
      }];
  }
  return null;
}

export function parseUpdateField(ctx) {
  const { view, fieldName, directives } = ctx;

  if (view.fields.indexOf(fieldName) >= 0 && directives.relation != null && directives.relation.name != null) {
    const { gqlFieldDefinition, table, context } = ctx;
    const { foreignGqlTypeName, isListType, isNonNullType } = getRelationMetasFromDefinition(gqlFieldDefinition);

    const { ownRelation, foreignRelation } = getRelations(context.dbMeta, directives.relation.name, table.tableName);

    if (ownRelation.columnName != null) {
      if (foreignRelation.type === 'MANY' && ownRelation.type === 'MANY') {
        // In case of ManyToMany it's an array
        return [createIdArrayField(ownRelation.columnName)];
      } else {
        // In case of ManyToOne it is an id
        return [createIdField(ownRelation.columnName)];
      }
    }
    return [];
  }
  return null;
}

export function parseCreateField(ctx) {
  return parseUpdateField(ctx);
}
