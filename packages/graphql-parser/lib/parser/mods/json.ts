import createScalar from '../createScalar';
import findDirectiveIndex from '../findDirectiveIndex';
import getJsonObjectBuilderExpression from '../getJsonObjectBuilderExpression';
import {
  _
} from 'lodash';

const JSON_SPLIT = '.';

export function init(graphQlDocument) {
  graphQlDocument.definitions.push(createScalar('JSON'));
}

export function parseField(field, ctx) {
  const fieldName = field.name.value;
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const tableName = ctx.view.tableName;
  const jsonDirectiveIndex = findDirectiveIndex(field, 'json');

  if (jsonDirectiveIndex < 0) {
    return false;
  }

  if (ctx.view.type === 'READ') {

    const jsonFields = {};

    Object.values(ctx.view.fields).forEach((viewFieldName: any) => {
      if (viewFieldName.startsWith(`${fieldName}${JSON_SPLIT}`)) {

        if (jsonFields[fieldName] == null) {
          jsonFields[fieldName] = [];
        }

        jsonFields[fieldName].push(viewFieldName);
      }
    });

    if (jsonFields[fieldName] != null) {
      jsonFields[fieldName].sort((a, b) => {
        if (a.split(JSON_SPLIT).length > b.split(JSON_SPLIT).length) {
          return -1;
        }
        if (a.split(JSON_SPLIT).length < b.split(JSON_SPLIT).length) {
          return 1;
        }
        return 0;
      });

      const matchObject = {};

      Object.values(jsonFields[fieldName]).forEach((viewFieldName) => {
        _.set(matchObject, viewFieldName, true);
      });

      const jsonExpression = getJsonObjectBuilderExpression(matchObject, fieldName, tableName);

      if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
      }

      ctx.dbView.fields.push({
        name: fieldName,
        expression: jsonExpression
      });

      if (ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames == null) {
        ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames = [];
      }

      ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames.push(fieldName);
      ctx.tableView.fields.push(field);
      return true;
    }
  } else {

    if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
      ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
    }

    field.type.name.value = field.type.name.value + 'Input';
    ctx.dbView.fields.push({
      name: fieldName,
      expression: `"${fieldName}"`
    });
    ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);
    ctx.tableView.fields.push(field);
    return true;
  }
}
