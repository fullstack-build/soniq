import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';
import { log } from 'util';

export function getLocalName(counter) {
  return `_local_${counter}_`;
}

export function getFieldExpression(name, typeNames, gQlType, localNameByType) {
  const fields = [];

  Object.values(typeNames).forEach((typeName) => {
    if (gQlType.types[typeName] != null && gQlType.types[typeName].nativeFieldNames.indexOf(name) >= 0 && localNameByType[typeName] != null) {
      fields.push(`"${localNameByType[typeName]}"."${name}"`);
    }
  });

  // ID can never be null. All other fields can.
  if (name !== 'id') {
    fields.push('null');
  }

  return `COALESCE(${fields.join(', ')})`;
}

export function getTypeNamesSelect(typeNames, gQlType, localNameByType) {
  const fields = [];

  Object.values(typeNames).forEach((typeName) => {
    if (gQlType.types[typeName] != null && localNameByType[typeName] != null) {
      fields.push(`"${localNameByType[typeName]}"."_typenames"`);
    }
  });

  return fields.join(' || ') + ' _typenames';
}

export function getFromExpression(typeNames, gQlType, localNameByType) {
  const joinTypes = [];
  let isFirstSet = false;
  let firstType: any;

  Object.values(typeNames).forEach((typeName) => {
    if (gQlType.types[typeName] != null && localNameByType[typeName] != null) {
      if (isFirstSet !== true) {
        isFirstSet = true;
        firstType = {
          typeName,
          viewName: gQlType.types[typeName].viewName,
          tableName: gQlType.types[typeName].tableName,
          localName: localNameByType[typeName]
        };
      } else {
        joinTypes.push({
          typeName,
          viewName: gQlType.types[typeName].viewName,
          tableName: gQlType.types[typeName].tableName,
          localName: localNameByType[typeName]
        });
      }
    }
  });

  const joins = joinTypes.map((value, key) => {
    return `FULL OUTER JOIN "${value.viewName}" AS "${value.localName}" on "${firstType.localName}".id = "${value.localName}".id`;
  });

  return `"${firstType.viewName}" AS "${firstType.localName}" ${joins.join(' ')}`;
}

export function resolveTable(c, query, gQlTypes, dbObject, match) {
  const tableName = Object.keys(query.fieldsByTypeName)[0];

  const gQlType = gQlTypes[tableName];

  let typeNames = gQlType.typeNames.map((type) => {
    return type;
  });

  if (query.args != null && query.args.typenames != null) {
    typeNames = query.args.typenames;
  }

  const fields = query.fieldsByTypeName[tableName];

  const localNameByType = {};
  let counter = c;

  Object.values(typeNames).forEach((typeName) => {
    localNameByType[typeName] = getLocalName(counter);
    counter += 1;
  });

  const fieldSelect = [];
  const idExpression = getFieldExpression('id', typeNames, gQlType, localNameByType);

  Object.values(fields).forEach((field) => {
    if (field.name !== '_typenames') {
      if (gQlType.relationByField[field.name] != null) {
        const relation = gQlType.relationByField[field.name];

        if (relation.relationType === 'ONE') {
          const fieldIdExpression = getFieldExpression(relation.fieldName, typeNames, gQlType, localNameByType);

          const ret = resolveRelation(counter, field, gQlType.relationByField[field.name], gQlTypes, dbObject, fieldIdExpression);

          counter = ret.counter;

          fieldSelect.push(ret.sql);
        }

        if (relation.relationType === 'MANY') {

          const ret = resolveRelation(counter, field, gQlType.relationByField[field.name], gQlTypes, dbObject, idExpression);

          counter = ret.counter;

          fieldSelect.push(ret.sql);
        }

      } else {
        fieldSelect.push(`${getFieldExpression(field.name, typeNames, gQlType, localNameByType)} "${field.name}"`);
      }
    } else {
      fieldSelect.push(getTypeNamesSelect(typeNames, gQlType, localNameByType));
    }
  });

  const fromExpression = getFromExpression(typeNames, gQlType, localNameByType);

  let sql = `SELECT ${fieldSelect.join(', \n')} FROM ${fromExpression}`;

  if (match != null) {
    const exp = getFieldExpression(match.foreignFieldName, typeNames, gQlType, localNameByType);
    sql += ` WHERE ${exp} = ${match.idExpression}`;
  }

  return {
    sql: `${sql}`,
    counter
  };
}

export function resolveRelation(c, query, relation, gQlTypes, dbObject, matchIdExpression) {
  const relationConnections = dbObject.relations[relation.relationName];
  const foreignRelation = relationConnections[0].tableName === relation.tableName ? relationConnections[1] : relationConnections[0];

  const match = {
    idExpression: matchIdExpression,
    foreignFieldName: 'id'
  };

  if (relation.relationType === 'ONE') {
    match.foreignFieldName = 'id';
    return rowToJson(c, query, gQlTypes, dbObject, match);
  } else {
    match.foreignFieldName = foreignRelation.reference.fieldName + '_' + foreignRelation.reference.tableName + '_id';
    return jsonAgg(c, query, gQlTypes, dbObject, match);
  }
}

export function rowToJson(c, query, gQlTypes, dbObject, match) {
  let counter = c;
  const localTableName = getLocalName(counter);
  counter += 1;

  const ret = resolveTable(counter, query, gQlTypes, dbObject, match);

  counter = ret.counter;

  const sql = `(SELECT row_to_json("${localTableName}") FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter
  };
}

export function jsonAgg(c, query, gQlTypes, dbObject, match) {
  let counter = c;
  const localTableName = getLocalName(counter);
  counter += 1;

  const ret = resolveTable(counter, query, gQlTypes, dbObject, match);

  counter = ret.counter;

  const sql = `(SELECT json_agg(row_to_json("${localTableName}")) FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter
  };
}

export function getQueryResolver(gQlTypes, dbObject) {
  return (obj, args, context, info) =>  {
    const query = parseResolveInfo(info);

    const {
      sql,
      counter
    } = jsonAgg(0, query, gQlTypes, dbObject, null);

    return { sql: `SELECT ${sql}` };
  };
}
