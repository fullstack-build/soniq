import findDirectiveIndex from '../utils/findDirectiveIndex';
import getArgumentByName from '../utils/getArgumentByName';
import parseObjectArgument from '../utils/parseObjectArgument';
import {
  _
} from 'lodash';

export function parseField(field, ctx) {
  const fieldName = field.name.value;
  const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;

  if (!isIncluded) {
    return false;
  }
  const customDirectiveIndex = findDirectiveIndex(field, 'custom');

  // field is not custom
  if (customDirectiveIndex < 0) {
    return false;
  }
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const tableName = ctx.view.tableName;
  const customDirective = field.directives[customDirectiveIndex];

  const resolverName = getArgumentByName(customDirective, 'resolver').value.value;
  const paramsNode = getArgumentByName(customDirective, 'params');
  let params = {};

  if (paramsNode != null) {
    params = parseObjectArgument(paramsNode);
  }

  const fieldKey = `${gqlTypeName}_${fieldName}`;

  // Add field to custom fields for resolving it seperate
  ctx.customFields[fieldKey] = {
    type: 'Field',
    gqlTypeName,
    fieldName,
    resolver: resolverName,
    params
  };

  // SQL expression returns always NULL for custom fields, to initialise them
  const fieldSql = `NULL::text AS "${fieldName}"`;

  if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
    ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
  }

  ctx.dbView.fields.push({
    name: fieldName,
    expression: fieldSql
  });

  // Add native fields to gQlTypes
  ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);

  // This field cannot be set with a generated mutation
  if (ctx.view.type === 'READ') {
    ctx.tableView.fields.push(field);
  }
  return true;
}
