
import { utils } from '@fullstack-one/graphql-parser';

const { findDirectiveIndex, getArgumentByName, parseObjectArgument, createIdArrayField } = utils;

import {
  _
} from 'lodash';

export function parseField(field, ctx) {
  const fieldName = field.name.value;
  const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;

  if (!isIncluded) {
    return false;
  }
  const filesDirectiveIndex = findDirectiveIndex(field, 'files');

  // field is not custom
  if (filesDirectiveIndex < 0) {
    return false;
  }

  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const tableName = ctx.view.tableName;
  const fileDirective = field.directives[filesDirectiveIndex];

  const resolverName = '@fullstack-one/file-storage/readFiles';
  const paramsNode = getArgumentByName(fileDirective, 'params');
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

  if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
    ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
  }

  ctx.dbView.fields.push({
    name: fieldName,
    expression: `"${fieldName}"`
  });

  // Add native fields to gQlTypes
  ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);

  // This field cannot be set with a generated mutation
  if (ctx.view.type !== 'READ') {
    ctx.tableView.fields.push(createIdArrayField(fieldName));
  } else {
    ctx.tableView.fields.push(field);
  }
  return true;
}
