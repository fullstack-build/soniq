import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';
import { _ } from 'lodash';

// Generate local alias name for views/tables
export function getLocalName(counter) {
  return `_local_${counter}_`;
}

export function includesAuthView(viewNames, noAuthViewNames) {
  let ret = null;
  viewNames.forEach((viewName) => {
    if (noAuthViewNames.indexOf(viewName) < 0) {
      ret = viewName;
    }
  });
  return ret;
}

export function getJsonMerge(jsonFields) {
  if (jsonFields.length < 1) {
    return `jsonb_build_object()`;
  }
  if (jsonFields.length < 2) {
    return jsonFields.pop();
  }
  const jsonField = jsonFields.pop();

  return `jsonb_merge(${jsonField}, ${getJsonMerge(jsonFields)})`;
}

// A Table can consist of multiple Views. So each field needs to be combined with COALESCE to one.
export function getFieldExpression(name, viewNames, gQlType, localNameByType) {
  const fields = [];
  // Put here any instead of boolean because ts lint sucks! Just WTF!?
  let isJson: any = false;

  // Get fields per View/Type. Not every field exists in every View/Type
  Object.values(viewNames).forEach((viewName: any) => {
    if (gQlType.views[viewName] != null && gQlType.views[viewName].nativeFieldNames.indexOf(name) >= 0 && localNameByType[viewName] != null) {
      fields.push(`"${localNameByType[viewName]}"."${name}"`);
    } else {
      if (gQlType.views[viewName] != null
        && gQlType.views[viewName].jsonFieldNames != null
        && gQlType.views[viewName].jsonFieldNames.indexOf(name) >= 0
        && localNameByType[viewName] != null) {
        isJson = true;
        fields.push(`"${localNameByType[viewName]}"."${name}"`);
      }
    }
  });

  // ID can never be null. All other fields can.
  if (name !== 'id' && isJson !== true) {
    fields.push('null');
  }

  if (isJson === true) {
    const jsonFields = fields.map((field) => {
      return `COALESCE(${field}, jsonb_build_object())`;
    });

    return getJsonMerge(jsonFields);
  }

  return `COALESCE(${fields.join(', ')})`;
}

// Combines _viewnames of the views to return something like _viewnames: [POST_OWNER, POST_AUTHOR]
export function getTypeNamesSelect(viewNames, gQlType, localNameByType) {
  const fields = [];

  Object.values(viewNames).forEach((viewName: any) => {
    if (gQlType.views[viewName] != null && localNameByType[viewName] != null) {
      fields.push(`"${localNameByType[viewName]}"."_viewnames"`);
    }
  });

  return fields.join(' || ') + ' _viewnames';
}

// Create FROM expression for query (or subquery)
export function getFromExpression(viewNames, gQlType, localNameByType) {
  const joinTypes = [];
  let isFirstSet = false;
  let firstType: any;

  // Walk through views/views to get all views which have been requested by input viewnames: [...]
  Object.values(viewNames).forEach((viewName: any) => {
    // We are only interested in views/views which are requested
    if (gQlType.views[viewName] != null && localNameByType[viewName] != null) {
      if (!isFirstSet) {
        // The first view will get loaded over the FROM expression
        isFirstSet = true;
        firstType = {
          viewName,
          nativeViewName: gQlType.views[viewName].viewName,
          viewSchemaName: gQlType.views[viewName].viewSchemaName,
          localName: localNameByType[viewName]
        };
      } else {
        // All other views need to be joined.
        joinTypes.push({
          viewName,
          nativeViewName: gQlType.views[viewName].viewName,
          viewSchemaName: gQlType.views[viewName].viewSchemaName,
          localName: localNameByType[viewName]
        });
      }
    }
  });

  // Join views with FULL OUTER JOIN to get all rows a user can see
  const joins = joinTypes.map((value, key) => {
    // Each joined view gets a local alias name and is required to match the id
    return `FULL OUTER JOIN "${value.viewSchemaName}"."${value.nativeViewName}"` +
    ` AS "${value.localName}" on "${firstType.localName}".id = "${value.localName}".id`;
  });

  // The combined views describe the table.
  // The first View will also get a local alias name
  return `"${firstType.viewSchemaName}"."${firstType.nativeViewName}" AS "${firstType.localName}" ${joins.join(' ')}`;
}

// This function basically creates a SQL query/subquery from a nested query object matching eventually a certain id-column
export function resolveTable(c, query, gQlTypes, dbObject, values, isAuthenticated, match) {
  // Get the tableName from the nested query object
  const tableName = Object.keys(query.fieldsByTypeName)[0];

  // Get gQlType (Includes informations about the views/views/columns/fields of the current table)
  const gQlType = gQlTypes[tableName];

  let viewNames = gQlType.viewNames;
  if (isAuthenticated !== true) {
    viewNames = gQlType.noAuthViewNames.slice();
  }

  // If the user has defined some viewNames in the query overwrite default viewNames
  if (query.args != null && query.args.viewnames != null) {
    viewNames = query.args.viewnames;
  }

  const authView = includesAuthView(viewNames, gQlType.noAuthViewNames);
  let authRequired = authView != null;

  if (isAuthenticated !== true) {
    if (authView != null) {
      throw new Error(`You need to be authenticated to access view [${authView}]`);
    }
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
  Object.values(viewNames).forEach((viewName: any) => {
    localNameByType[viewName] = getLocalName(counter);
    counter += 1;
  });

  // A list of SELECT field expressions
  const fieldSelect = [];

  // The expression to get the current entity-id for matching with relations
  const idExpression = getFieldExpression('id', viewNames, gQlType, localNameByType);

  // Walk through all requested fields to generate the selected fields and their expressions
  Object.values(fields).forEach((field: any) => {
    if (field.name !== '_viewnames') {
      if (gQlType.relationByField[field.name] != null) {

        // If the field is a relation we need to resolve it with a subquery
        const relation = gQlType.relationByField[field.name];
        if (relation.relationType === 'ONE') {
          // A ONE relation has a certain fieldIdExpression like "ownerUserId"
          const fieldIdExpression = getFieldExpression(relation.columnName, viewNames, gQlType, localNameByType);

          // Resolve the field with a subquery which loads the related data
          const ret = resolveRelation(counter, field, relation, gQlTypes, dbObject, values,
                                      fieldIdExpression, viewNames, gQlType, localNameByType, isAuthenticated);

          // The resolveRelation() function can also increase the counter because it may loads relations
          // So we need to take the counter from there
          counter = ret.counter;

          // pass down authRequired
          authRequired = authRequired || ret.authRequired;

          // Add the new subquery into fields select of the current query
          fieldSelect.push(ret.sql);
        }

        if (relation.relationType === 'MANY') {
          // A many relation just needs to match by it's idExpression
          // Resolve the field with a subquery which loads the related data
          // tslint:disable-next-line:max-line-length
          const ret = resolveRelation(counter, field, gQlType.relationByField[field.name], gQlTypes, dbObject, values, idExpression, viewNames, gQlType, localNameByType, isAuthenticated);

          // The resolveRelation() function can also increase the counter because it may loads relations
          // So we need to take the counter from there
          counter = ret.counter;

          // pass down authRequired
          authRequired = authRequired || ret.authRequired;

          // Add the new subquery into fields select of the current query
          fieldSelect.push(ret.sql);
        }

      } else {
        // If the field is not a relation nor _viewnames it can simply be combined from all views to one field with alias
        fieldSelect.push(`${getFieldExpression(field.name, viewNames, gQlType, localNameByType)} "${field.name}"`);
      }
    } else {
      // For fieldName is _viewnames a special expression is required to combine all views of the views per row
      fieldSelect.push(getTypeNamesSelect(viewNames, gQlType, localNameByType));
    }
  });

  // Get the view combination (Join of Views)
  const fromExpression = getFromExpression(viewNames, gQlType, localNameByType);

  // Combine the field select expressions with the from expression to one SQL query
  let sql = `SELECT ${fieldSelect.join(', \n')} FROM ${fromExpression}`;

  // When the query needs to match a field add a WHERE clause
  // This is required for relations and mutation-responses (e.g. "Post.owner_User_id = User.id")
  if (match != null) {
    const exp = getFieldExpression(match.foreignFieldName, viewNames, gQlType, localNameByType);

    if (match.type !== 'ARRAY') {
      sql += ` WHERE ${exp} = ${match.fieldExpression}`;
    } else {
      sql += ` WHERE ${match.fieldExpression} @> ARRAY[${exp}]::uuid[]`;
    }
  }

  // Check if a custom sql statement exists
  if (customSqlQuery != null) {
    // Add AND/WHERE dependent on the previos concatination
    if (match != null) {
      sql += ` AND`;
    } else {
      sql += ` WHERE`;
    }

    // Compile the lodash template to replace fields and params
    const compiled = _.template(customSqlQuery.text);

    // Generate correct sql query to add it to the main query
    const sqlQuery = compiled({
      // The param function returns e.g. $1, $2 and adds the value to the correct position
      param: (index) => {

        // Throw error when the requested value is not in the values array
        if (customSqlQuery.values[index] == null) {
          throw new Error(`Requested value "param(${index})" in custom SQL query is not defined: "${customSqlQuery.text}"`);
        }

        // Push current value to output value array
        const value = customSqlQuery.values[index];
        values.push(value);

        // Return $n for pg pgClient
        return '$' + values.length;
      },
      // Gets a correct expression for a field e.g.: "COALESCE("_local_4_"."title", "_local_5_"."title", null)"
      field: (name) => {
        return getFieldExpression(name, viewNames, gQlType, localNameByType);
      }
    });

    // Add custom query to main query
    sql += ` ${sqlQuery}`;
  }

  return {
    sql: `${sql}`,
    counter,
    values,
    authRequired
  };
}

// Resolves a relation of a column/field to a new Subquery
export function resolveRelation(c, query, relation, gQlTypes, dbObject, values, matchIdExpression,
                                viewNames, gQlType, localNameByType, isAuthenticated) {
  // Get the relation from dbObject
  const relationConnections = dbObject.relations[relation.relationName];

  const relationConnectionsArray: any = Object.values(relationConnections);

  // Determine which relation is the foreign one to get the correct columnName
  const foreignRelation = relationConnectionsArray[0].tableName === relation.tableName ? relationConnectionsArray[1] : relationConnectionsArray[0];

  // Determine which relation is the own one to get the correct columnName
  const ownRelation = relationConnectionsArray[0].tableName === relation.tableName ? relationConnectionsArray[0] : relationConnectionsArray[1];

  // Match will filter for the correct results (e.g. "Post.owner_User_id = User.id")
  const match = {
    type: 'SIMPLE',
    fieldExpression: matchIdExpression,
    foreignFieldName: 'id'
  };

  if (relation.relationType === 'ONE') {
    // If this is the ONE part/column/field of the relation we need to match by its id
    match.foreignFieldName = 'id';

    // A ONE relation will respond a single object
    return rowToJson(c, query, gQlTypes, dbObject, values, isAuthenticated, match);
  } else {
    // check if this is a many to many relation
    if (foreignRelation.type === 'MANY') {
      const arrayMatch = {
        type: 'ARRAY',
        fieldExpression: getFieldExpression(ownRelation.columnName, viewNames, gQlType, localNameByType),
        foreignFieldName: 'id'
      };

      return jsonAgg(c, query, gQlTypes, dbObject, values, isAuthenticated, arrayMatch);
    } else {

      // If this is the MANY part/column/field of the relation we need to match by its foreignColumnName
      match.foreignFieldName = foreignRelation.columnName;

      // A MANY relation will respond an array of objects
      return jsonAgg(c, query, gQlTypes, dbObject, values, isAuthenticated, match);

    }
  }
}

// Generates an object from a select query (This is needed for ONE relations like loading a owner of a post)
export function rowToJson(c, query, gQlTypes, dbObject, values, isAuthenticated, match) {
  // Counter is to generate unique local aliases for all Tables (Joins of Views)
  let counter = c;
  // Generate new local alias (e.g. "_local_1_")
  const localTableName = getLocalName(counter);
  counter += 1;

  // Get SELECT query for current Table (Join of Views)
  const ret = resolveTable(counter, query, gQlTypes, dbObject, values, isAuthenticated, match);

  // The resolveTable() function can also increase the counter because it may loads relations
  // So we need to take the counter from there
  counter = ret.counter;
  const authRequired = ret.authRequired;

  // Wrap the Table Select around row_to_json to generate an JSON objects
  // It will be named as localTableName (e.g. "_local_1_")
  // The result will be named to the querie's name
  const sql = `(SELECT row_to_json("${localTableName}") FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter,
    values,
    authRequired
  };
}

// Generates Array of Objects from a select query
export function jsonAgg(c, query, gQlTypes, dbObject, values, isAuthenticated, match) {
  // Counter is to generate unique local aliases for all Tables (Joins of Views)
  let counter = c;
  // Generate new local alias (e.g. "_local_1_")
  const localTableName = getLocalName(counter);
  counter += 1;

  // Get SELECT query for current Table (Join of Views)
  const ret = resolveTable(counter, query, gQlTypes, dbObject,values, isAuthenticated, match);

  // The resolveTable() function can also increase the counter because it may loads relations
  // So we need to take the counter from there
  counter = ret.counter;
  const authRequired = ret.authRequired;

  // Wrap the Table Select around json_agg and row_to_json to generate an JSON array of objects
  // It will be named as localTableName (e.g. "_local_1_")
  // The result will be named to the querie's name
  // Edit: Added COALESCE(..., '[]'::json) to catch replace NULL with an empty array if subquery has no results
  const sql = `(SELECT COALESCE(json_agg(row_to_json("${localTableName}")), '[]'::json) FROM (${ret.sql}) "${localTableName}") "${query.name}"`;

  return {
    sql,
    counter,
    values,
    authRequired
  };
}

export function getQueryResolver(gQlTypes, dbObject) {
  return (obj, args, context, info, isAuthenticated, match = null) =>  {

    // Use PostGraphile parser to get nested query objeect
    const query = parseResolveInfo(info);

    // The first query is always a aggregation (array of objects) => Just like SQL you'll always get rows
    const {
      sql,
      counter,
      values,
      authRequired
    } = jsonAgg(0, query, gQlTypes, dbObject, [], isAuthenticated, match);

    return { sql: `SELECT ${sql}`, values, query, authRequired };
  };
}
