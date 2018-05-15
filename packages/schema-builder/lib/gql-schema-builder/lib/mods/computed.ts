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

  const computedDirectiveIndex = findDirectiveIndex(field, 'computed');

  // field is expression
  if (computedDirectiveIndex < 0) {
    return false;
  }
  const computedDirective = field.directives[computedDirectiveIndex];
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const tableName = ctx.view.tableName;

  const expressionName = getArgumentByName(computedDirective, 'expression').value.value;
  const paramsNode = getArgumentByName(computedDirective, 'params');
  let params = {};

  if (paramsNode != null) {
    params = parseObjectArgument(paramsNode);
  }

  if (ctx.expressionsByName[expressionName] == null) {
    throw new Error('Expression `' + expressionName + '` does not exist. You used it in table `' + gqlTypeName + '`.');
  }

  const expressionContext = {
    gqlTypeName,
    table: `"${ctx.schemaName}"."${tableName}"`,
    tableName,
    schemaName: ctx.schemaName,
    field: fieldName,
    view: `"${ctx.viewSchemaName}"."${viewName}"`,
    viewName,
    viewSchemaName: ctx.viewSchemaName,
    currentUserId: () => {
      ctx.gQlTypes[gqlTypeName].authViewNames.push(viewName);
      const viewIndex = ctx.gQlTypes[gqlTypeName].noAuthViewNames.indexOf(viewName);
      if (viewIndex >= 0) {
        ctx.gQlTypes[gqlTypeName].noAuthViewNames.splice(viewIndex, 1);
      }

      return '_meta.current_user_id()';
    }
  };

  const fieldExpression = ctx.expressionsByName[expressionName].generate(expressionContext, params);
  // expression to SQL
  const fieldSql = `(${fieldExpression}) AS "${fieldName}"`;

  ctx.dbView.fields.push({
    name: fieldName,
    expression: fieldSql
  });

  if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
    ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
  }

  // Add native fields to gQlTypes
  ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);

  // This field cannot be set with a generated mutation
  if (ctx.view.type === 'READ') {
    ctx.tableView.fields.push(field);
  }
  return true;
}
