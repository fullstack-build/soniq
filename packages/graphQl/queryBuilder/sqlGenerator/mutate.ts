import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';
import { log } from 'util';

function resolveCreateMutation(query, mutation) {
  const fieldNames = Object.keys(query.args.input);
  const fieldValues = Object.values(query.args.input);

  const values = [];

  const f = fieldNames.map((name) => {
    // tslint:disable-next-line:quotemark
    return '"' + name + '"';
  }).join(', ');

  // tslint:disable-next-line:quotemark
  const v = fieldValues.map((value) => {
    values.push(value);
    return '$' + values.length;
  }).join(', ');

  // tslint:disable-next-line:quotemark
  return { sql: `INSERT INTO "${mutation.viewName}" (${f}) VALUES (${v})`, values, mutation, id: query.args.input.id };
}

function resolveUpdateMutation(query, mutation) {
  const fieldNames = Object.keys(query.args.input);
  const fieldValues = Object.values(query.args.input);

  const setFields = [];
  const values = [];
  let entityId = null;

  Object.keys(query.args.input).forEach((fieldName) => {
    const fieldValue = query.args.input[fieldName];
    if (fieldName !== 'id') {
      values.push(fieldValue);
      setFields.push(`"${fieldName}" = $${values.length}`);
    } else {
      entityId = fieldValue;
    }
  });

  values.push(entityId);

  return { sql: `UPDATE "${mutation.viewName}" SET ${setFields.join(', ')} WHERE id = $${values.length}`, values, mutation, id: query.args.input.id };
}

function resolveDeleteMutation(query, mutation) {
  return { sql: `DELETE FROM "${mutation.viewName}" WHERE id = $1 RETURNING id`, values: [query.args.input.id], mutation, id: query.args.input.id };
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
      case 'DELETE':
        return resolveDeleteMutation(query, mutation);
      default:
        throw new Error('Mutation-Type does not exist! "' + mutation.type + '"');
    }

  };
}
