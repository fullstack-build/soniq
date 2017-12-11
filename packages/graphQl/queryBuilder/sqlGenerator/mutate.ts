import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';
import { log } from 'util';

function resolveCreateMutation(query, mutation) {
  const fieldNames = Object.keys(query.args.input);
  const fieldValues = Object.values(query.args.input);

  const f = fieldNames.map((name) => {
    // tslint:disable-next-line:quotemark
    return "'" + name + "'";
  }).join(', ');

  // tslint:disable-next-line:quotemark
  const v = fieldValues.map((value) => {
    let tempValue = value;

    if (isNaN(tempValue)) {
      // tslint:disable-next-line:quotemark
      tempValue = "'" + tempValue + "'";
    }

    return tempValue;
  }).join(', ');

  // tslint:disable-next-line:quotemark
  return { sql: `INSERT INTO ${mutation.viewName} (${f}) VALUES (${v})` };
}

function resolveUpdateMutation(query, mutation) {
  const fieldNames = Object.keys(query.args.input);
  const fieldValues = Object.values(query.args.input);

  const setFields = [];
  let entityId = null;

  Object.keys(query.args.input).forEach((fieldName) => {
    let fieldValue = query.args.input[fieldName];
    if (fieldName !== 'id') {

      if (isNaN(fieldValue)) {
        // tslint:disable-next-line:quotemark
        fieldValue = "'" + fieldValue + "'";
      }

      // TODO: This is a SQL Injection Issue
      setFields.push(`"${fieldName}" = ${fieldValue}`);
    } else {
      entityId = fieldValue;
    }
  });

  if (isNaN(entityId)) {
    // tslint:disable-next-line:quotemark
    entityId = "'" + entityId + "'";
  }

  // tslint:disable-next-line:quotemark
  const v = fieldValues.map((value) => {
    // tslint:disable-next-line:quotemark
    return "'" + value + "'";
  }).join(', ');

  // tslint:disable-next-line:quotemark
  return { sql: `UPDATE ${mutation.viewName} SET ${setFields.join(', ')} WHERE id = ${entityId}` };
}

export function getMutationResolver(gQlTypes, dbObject, mutations) {
  const mutationsByName = {};

  Object.values(mutations).forEach((mutation) => {
    mutationsByName[mutation.name] = mutation;
  });

  return (obj, args, context, info) =>  {
    const query = parseResolveInfo(info);

    const mutation = mutationsByName[query.name];

    switch (mutation.type) {
      case 'CREATE':
        return resolveCreateMutation(query, mutation);
      case 'UPDATE':
        return resolveUpdateMutation(query, mutation);
      default:
        throw new Error('Mutation-Type does not exist! "' + mutation.type + '"');
    }

  };
}
