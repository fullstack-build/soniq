import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';
import { log } from 'util';

// Generate local alias name for views/tables
export function getLocalName(counter) {
  return `_local_${counter}_`;
}

// A Table can consist of multiple Views. So each field needs to be combined with COALESCE to one.
export function getFieldExpression(name, typeNames, gQlType, localNameByType) {
  const fields = [];

  // Get fields per View/Type. Not every field exists in every View/Type
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

// Combines _typenames of the views to return something like _typenames: [POST_OWNER, POST_AUTHOR]
export function getTypeNamesSelect(typeNames, gQlType, localNameByType) {
  const fields = [];

  Object.values(typeNames).forEach((typeName) => {
    if (gQlType.types[typeName] != null && localNameByType[typeName] != null) {
      fields.push(`"${localNameByType[typeName]}"."_typenames"`);
    }
  });

  return fields.join(' || ') + ' _typenames';
}

// Create FROM expression for query (or subquery)
export function getFromExpression(typeNames, gQlType, localNameByType) {
  const joinTypes = [];
  let isFirstSet = false;
  let firstType: any;

  // Walk through types/views to get all views which have been requested by input typenames: [...]
  Object.values(typeNames).forEach((typeName) => {
    // We are only interested in views/types which are requested
    if (gQlType.types[typeName] != null && localNameByType[typeName] != null) {
      if (!isFirstSet) {
        // The first view will get loaded over the FROM expression
        isFirstSet = true;
        firstType = {
          typeName,
          viewName: gQlType.types[typeName].viewName,
          tableName: gQlType.types[typeName].tableName,
          localName: localNameByType[typeName]
        };
      } else {
        // All other views need to be joined.
        joinTypes.push({
          typeName,
          viewName: gQlType.types[typeName].viewName,
          tableName: gQlType.types[typeName].tableName,
          localName: localNameByType[typeName]
        });
      }
    }
  });

  // Join views with FULL OUTER JOIN to get all rows a user can see
  const joins = joinTypes.map((value, key) => {
    // Each joined view gets a local alias name and is required to match the id
    return `FULL OUTER JOIN "${value.viewName}" AS "${value.localName}" on "${firstType.localName}".id = "${value.localName}".id`;
  });

  // The combined views describe the table.
  // The first View will also get a local alias name
  return `"${firstType.viewName}" AS "${firstType.localName}" ${joins.join(' ')}`;
}

// This function basically creates a SQL query/subquery from a nested query object matching eventually a certain id-column
export function resolveTable(c, query, gQlTypes, dbObject, match) {
  // Get the tableName from the nested query object
  const tableName = Object.keys(query.fieldsByTypeName)[0];

  // Get gQlType (Includes informations about the types/views/columns/fields of the current table)
  const gQlType = gQlTypes[tableName];

  // Get all typeNames of the current table as array of strings
  let typeNames = gQlType.typeNames.map((type) => {
    return type;
  });

  // If the user has defined some typeNames in the query overwrite default typeNames
  if (query.args != null && query.args.typenames != null) {
    typeNames = query.args.typenames;
  }

  let customSqlQuery = null;

  // Get the custom SQL Statement/Expression from query if available
  if (query.args != null && query.args.sql != null) {
    customSqlQuery = query.args.sql;
  }

  // Get requested fields
  const fields = query.fieldsByTypeName[tableName];

  const localNameByType = {};
  let counter = c;

  // Generate local alias names for each view (e.g. "_local_12_")
  Object.values(typeNames).forEach((typeName) => {
    localNameByType[typeName] = getLocalName(counter);
    counter += 1;
  });

  // A list of SELECT field expressions
  const fieldSelect = [];

  // The expression to get the current entity-id for matching with relations
  const idExpression = getFieldExpression('id', typeNames, gQlType, localNameByType);

  // Walk through all requested fields to generate the selected fields and their expressions
  Object.values(fields).forEach((field) => {
    if (field.name !== '_typenames') {
      if (gQlType.relationByField[field.name] != null) {

        // If the field is a relation we need to resolve it with a subquery
        const relation = gQlType.relationByField[field.name];
        if (relation.relationType === 'ONE') {
          // A ONE relation has a certain fieldIdExpression like "ownerUserId"
          const fieldIdExpression = getFieldExpression(relation.columnName, typeNames, gQlType, localNameByType);

          // Resolve the field with a subquery which loads the related data
          const ret = resolveRelation(counter, field, gQlType.relationByField[field.name], gQlTypes, dbObject, fieldIdExpression);

          // The resolveRelation() function can also increase the counter because it may loads relations
          // So we need to take the counter from there
          counter = ret.counter;

          // Add the new subquery into fields select of the current query
          fieldSelect.push(ret.sql);
        }

        if (relation.relationType === 'MANY') {
          // A many relation just needs to match by it's idExpression
          // Resolve the field with a subquery which loads the related data
          const ret = resolveRelation(counter, field, gQlType.relationByField[field.name], gQlTypes, dbObject, idExpression);

          // The resolveRelation() function can also increase the counter because it may loads relations
          // So we need to take the counter from there
          counter = ret.counter;

          // Add the new subquery into fields select of the current query
          fieldSelect.push(ret.sql);
        }

      } else {
        // If the field is not a relation nor _typenames it can simply be combined from all views to one field with alias
        fieldSelect.push(`${getFieldExpression(field.name, typeNames, gQlType, localNameByType)} "${field.name}"`);
      }
    } else {
      // For fieldName is _typenames a special expression is required to combine all types of the views per row
      fieldSelect.push(getTypeNamesSelect(typeNames, gQlType, localNameByType));
    }
  });

  // Get the view combination (Join of Views)
  const fromExpression = getFromExpression(typeNames, gQlType, localNameByType);

  // Combine the field select expressions with the from expression to one SQL query
  let sql = `SELECT ${fieldSelect.join(', \n')} FROM ${fromExpression}`;

  // When the query needs to match a field add a WHERE clause
  // This is required for relations and mutation-responses (e.g. "Post.owner_User_id = User.id")
  if (match != null) {
    const exp = getFieldExpression(match.foreignFieldName, typeNames, gQlType, localNameByType);
    sql += ` WHERE ${exp} = ${match.idExpression}`;
  }

  // TODO: Make this injection save and more useful
  // This is not finished. I will write docs once it is.
  if (customSqlQuery != null) {
    if (match != null) {
      sql += ` AND`;
    } else {
      sql += ` WHERE`;
    }
    sql += ` ${customSqlQuery.text}`;
  }

  return {
    sql: `${sql}`,
    counter
  };
}

// Resolves a relation of a column/field to a new Subquery
export function resolveRelation(c, query, relation, gQlTypes, dbObject, matchIdExpression) {
  // Get the relation from dbObject
  const relationConnections = dbObject.relations[relation.relationName];

  // Determine which relation is the foreign one to get the correct columnName
  const foreignRelation = relationConnections[0].tableName === relation.tableName ? relationConnections[1] : relationConnections[0];

  // Match will filter for the correct results (e.g. "Post.owner_User_id = User.id")
  const match = {
    idExpression: matchIdExpression,
    foreignFieldName: 'id'
  };

  if (relation.relationType === 'ONE') {
    // If this is the ONE part/column/field of the relation we need to match by its id
    match.foreignFieldName = 'id';

    // A ONE relation will respond a single object
    return rowToJson(c, query, gQlTypes, dbObject, match);
  } else {
    // If this is the MANY part/column/field of the relation we need to match by its foreignColumnName
    match.foreignFieldName = foreignRelation.columnName;

    // A MANY relation will respond an array of objects
    return jsonAgg(c, query, gQlTypes, dbObject, match);
  }
}

// Generates an object from a select query (This is needed for ONE relations like loading a owner of a post)
export function rowToJson(c, query, gQlTypes, dbObject, match) {
  // Counter is to generate unique local aliases for all Tables (Joins of Views)
  let counter = c;
  // Generate new local alias (e.g. "_local_1_")
  const localTableName = getLocalName(counter);
  counter += 1;

  // Get SELECT query for current Table (Join of Views)
  const ret = resolveTable(counter, query, gQlTypes, dbObject, match);

  // The resolveTable() function can also increase the counter because it may loads relations
  // So we need to take the counter from there
  counter = ret.counter;

  // Wrap the Table Select around row_to_json to generate an JSON objects
  // It will be named as localTableName (e.g. "_local_1_")
  // The result will be named to the querie's name
  const sql = `(SELECT row_to_json("${localTableName}") FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter
  };
}

// Generates Array of Objects from a select query
export function jsonAgg(c, query, gQlTypes, dbObject, match) {
  // Counter is to generate unique local aliases for all Tables (Joins of Views)
  let counter = c;
  // Generate new local alias (e.g. "_local_1_")
  const localTableName = getLocalName(counter);
  counter += 1;

  // Get SELECT query for current Table (Join of Views)
  const ret = resolveTable(counter, query, gQlTypes, dbObject, match);

  // The resolveTable() function can also increase the counter because it may loads relations
  // So we need to take the counter from there
  counter = ret.counter;

  // Wrap the Table Select around json_agg and row_to_json to generate an JSON array of objects
  // It will be named as localTableName (e.g. "_local_1_")
  // The result will be named to the querie's name
  const sql = `(SELECT json_agg(row_to_json("${localTableName}")) FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter
  };
}

export function getQueryResolver(gQlTypes, dbObject) {
  return (obj, args, context, info, match = null) =>  {

    // Use PostGraphile parser to get nested query objeect
    const query = parseResolveInfo(info);

    // The first query is always a aggregation (array of objects) => Just like SQL you'll always get rows
    const {
      sql,
      counter
    } = jsonAgg(0, query, gQlTypes, dbObject, match);

    return { sql: `SELECT ${sql}`, values: [], query };
  };
}
