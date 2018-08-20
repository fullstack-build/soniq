"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_parse_resolve_info_1 = require("graphql-parse-resolve-info");
const custom_1 = require("./custom");
class QueryBuilder {
    constructor(resolverMeta, dbMeta, costLimit) {
        this.aggregationLimits = [];
        this.resolverMeta = resolverMeta;
        this.dbMeta = dbMeta;
        this.costLimit = costLimit;
    }
    build(obj, args, context, info, isAuthenticated, match = null) {
        this.aggregationLimits = [];
        // Use PostGraphile parser to get nested query object
        const query = graphql_parse_resolve_info_1.parseResolveInfo(info);
        // The first query is always a aggregation (array of objects) => Just like SQL you'll always get rows
        const { sql, counter, values, authRequired } = this.jsonAgg(0, query, [], isAuthenticated, match);
        let cost = 1;
        this.aggregationLimits.forEach((limit) => {
            if (limit > 0) {
                cost *= limit;
            }
        });
        const potentialHighCost = cost > this.costLimit;
        return { sql: `SELECT ${sql};`, values, query, authRequired, potentialHighCost, cost };
    }
    // Generate local alias name for views/tables
    getLocalName(counter) {
        return `_local_${counter}_`;
    }
    // We check if a field is valid to prevent sql-injection
    getFieldExpression(name, localName) {
        return `"${localName}"."${name}"`;
    }
    // Create FROM expression for query (or subquery)
    getFromExpression(gqlTypeMeta, localName, authRequired) {
        const viewName = authRequired === true ? gqlTypeMeta.authViewName : gqlTypeMeta.publicViewName;
        return `"${gqlTypeMeta.viewSchemaName}"."${viewName}" AS "${localName}"`;
    }
    // This function basically creates a SQL query/subquery from a nested query object matching eventually a certain id-column
    resolveTable(c, query, values, isAuthenticated, match, isAggregation) {
        // Get the tableName from the nested query object
        const gqlTypeName = Object.keys(query.fieldsByTypeName)[0];
        // Get gQlType (Includes informations about the views/views/columns/fields of the current table)
        const gqlTypeMeta = this.resolverMeta.query[gqlTypeName];
        const gqlTypePermissionMeta = this.resolverMeta.permissionMeta[gqlTypeName] || {};
        const isRootLevelGenericAggregation = isAggregation === true && c < 2 && match == null;
        if (isRootLevelGenericAggregation === true && gqlTypePermissionMeta.disallowGenericRootLevelAggregation === true) {
            throw new Error(`The type '${gqlTypeName}' cannot be accessed by a root level aggregation.`);
        }
        // Get requested fields
        const fields = query.fieldsByTypeName[gqlTypeName];
        let counter = c;
        // Generate local alias names for each table (e.g. "_local_12_")
        const localName = this.getLocalName(counter);
        counter += 1;
        // A list of SELECT field expressions
        const fieldSelect = [];
        // The expression to get the current entity-id for matching with relations
        const idExpression = this.getFieldExpression('id', localName);
        let authRequired = false;
        let authRequiredHere = false;
        // Walk through all requested fields to generate the selected fields and their expressions
        Object.values(fields).forEach((field) => {
            if (gqlTypeMeta.fields[field.name] == null) {
                throw new Error(`The field '${gqlTypeName}.${field.name}' is not available.`);
            }
            const fieldMeta = gqlTypeMeta.fields[field.name];
            if (gqlTypeMeta.publicFieldNames.indexOf(field.name) < 0 && fieldMeta.nativeFieldName != null) {
                authRequired = true;
                authRequiredHere = true;
                if (isAuthenticated !== true) {
                    throw new Error(`The field '${gqlTypeName}.${field.name}' is not available without authentication.`);
                }
            }
            if (fieldMeta.meta != null && fieldMeta.meta.relationName != null) {
                // If the field is a relation we need to resolve it with a subquery
                if (fieldMeta.meta.isListType === false) {
                    // A ONE relation has a certain fieldIdExpression like "ownerUserId"
                    const fieldIdExpression = this.getFieldExpression(fieldMeta.nativeFieldName, localName);
                    // Resolve the field with a subquery which loads the related data
                    const ret = this.resolveRelation(counter, field, fieldMeta, localName, fieldIdExpression, values, isAuthenticated);
                    // The resolveRelation() function can also increase the counter because it may loads relations
                    // So we need to take the counter from there
                    counter = ret.counter;
                    // pass down authRequired
                    authRequired = authRequired || ret.authRequired;
                    // Add the new subquery into fields select of the current query
                    fieldSelect.push(ret.sql);
                }
                else {
                    // A many relation just needs to match by it's idExpression
                    // Resolve the field with a subquery which loads the related data
                    // tslint:disable-next-line:max-line-length
                    const ret = this.resolveRelation(counter, field, fieldMeta, localName, idExpression, values, isAuthenticated);
                    // The resolveRelation() function can also increase the counter because it may loads relations
                    // So we need to take the counter from there
                    counter = ret.counter;
                    // pass down authRequired
                    authRequired = authRequired || ret.authRequired;
                    // Add the new subquery into fields select of the current query
                    fieldSelect.push(ret.sql);
                }
            }
            else {
                // If the field is not a relation nor _viewnames it can simply be combined from all views to one field with alias
                fieldSelect.push(`${this.getFieldExpression(field.name, localName)} "${field.name}"`);
            }
        });
        // Translate a unsecure user-input value to a parameter like $1, $2, ... and adds the value to query-values
        const getParam = (value) => {
            values.push(value);
            return '$' + values.length;
        };
        // A field can be a COALESCE of view-columns. Thus we need to get the correct expression.
        const getField = (name) => {
            let virtualFieldName = null;
            Object.keys(gqlTypeMeta.fields).some((fieldName) => {
                const field = gqlTypeMeta.fields[fieldName];
                if (field.nativeFieldName === name) {
                    virtualFieldName = fieldName;
                    return true;
                }
                return false;
            });
            if (virtualFieldName == null) {
                throw new Error(`Field '${name}' not found.`);
            }
            if (gqlTypeMeta.publicFieldNames.indexOf(virtualFieldName) < 0) {
                authRequired = true;
                authRequiredHere = true;
                if (isAuthenticated !== true) {
                    throw new Error(`The field '${gqlTypeName}.${name}' is not available without authentication.`);
                }
            }
            return this.getFieldExpression(name, localName);
        };
        if (isAggregation === true) {
            const defaultLimit = this.costLimit / 2 > 1 ? this.costLimit / 2 + 0.101111 : 1.101111;
            this.aggregationLimits.push(query.args.limit || defaultLimit);
        }
        else {
            this.aggregationLimits.push(1.101111);
        }
        // Add possible custom queries to the main query. (where/limit/offset/orderBy)
        const customQuery = custom_1.generateCustomSql(match != null, query.args, getParam, getField);
        // Get the view combination (Join of Views)
        const fromExpression = this.getFromExpression(gqlTypeMeta, localName, authRequiredHere);
        // Combine the field select expressions with the from expression to one SQL query
        let sql = `SELECT ${fieldSelect.join(', ')} FROM ${fromExpression}`;
        // When the query needs to match a field add a WHERE clause
        // This is required for relations and mutation-responses (e.g. "Post.owner_User_id = User.id")
        if (match != null) {
            const exp = this.getFieldExpression(match.foreignFieldName, localName);
            if (match.type !== 'ARRAY') {
                sql += ` WHERE ${exp} = ${match.fieldExpression}`;
            }
            else {
                sql += ` WHERE ${match.fieldExpression} @> ARRAY[${exp}]::uuid[]`;
            }
        }
        sql += customQuery;
        return {
            sql,
            counter,
            values,
            authRequired
        };
    }
    // Resolves a relation of a column/field to a new Subquery
    resolveRelation(c, query, fieldMeta, localName, matchIdExpression, values, isAuthenticated) {
        // Get the relation from dbMeta
        const relationConnections = this.dbMeta.relations[fieldMeta.meta.relationName];
        const relationConnectionsArray = Object.values(relationConnections);
        const isFirstRelation = relationConnectionsArray[0].tableName === fieldMeta.meta.table.tableName;
        // Determine which relation is the foreign one to get the correct columnName
        const foreignRelation = isFirstRelation !== true ? relationConnectionsArray[0] : relationConnectionsArray[1];
        // Determine which relation is the own one to get the correct columnName
        const ownRelation = isFirstRelation === true ? relationConnectionsArray[0] : relationConnectionsArray[1];
        // Match will filter for the correct results (e.g. "Post.owner_User_id = User.id")
        const match = {
            type: 'SIMPLE',
            fieldExpression: matchIdExpression,
            foreignFieldName: 'id'
        };
        if (ownRelation.type === 'ONE') {
            // If this is the ONE part/column/field of the relation we need to match by its id
            match.foreignFieldName = 'id';
            // A ONE relation will respond a single object
            return this.rowToJson(c, query, values, isAuthenticated, match);
        }
        else {
            // check if this is a many to many relation
            if (foreignRelation.type === 'MANY') {
                const arrayMatch = {
                    type: 'ARRAY',
                    fieldExpression: this.getFieldExpression(ownRelation.columnName, localName),
                    foreignFieldName: 'id'
                };
                return this.jsonAgg(c, query, values, isAuthenticated, arrayMatch);
            }
            else {
                // If this is the MANY part/column/field of the relation we need to match by its foreignColumnName
                match.foreignFieldName = foreignRelation.columnName;
                // A MANY relation will respond an array of objects
                return this.jsonAgg(c, query, values, isAuthenticated, match);
            }
        }
    }
    // Generates an object from a select query (This is needed for ONE relations like loading a owner of a post)
    rowToJson(c, query, values, isAuthenticated, match) {
        // Counter is to generate unique local aliases for all Tables (Joins of Views)
        let counter = c;
        // Generate new local alias (e.g. "_local_1_")
        const localTableName = this.getLocalName(counter);
        counter += 1;
        // Get SELECT query for current Table (Join of Views)
        const ret = this.resolveTable(counter, query, values, isAuthenticated, match, false);
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
    jsonAgg(c, query, values, isAuthenticated, match) {
        // Counter is to generate unique local aliases for all Tables (Joins of Views)
        let counter = c;
        // Generate new local alias (e.g. "_local_1_")
        const localName = this.getLocalName(counter);
        counter += 1;
        // Get SELECT query for current Table (Join of Views)
        const ret = this.resolveTable(counter, query, values, isAuthenticated, match, true);
        // The resolveTable() function can also increase the counter because it may loads relations
        // So we need to take the counter from there
        counter = ret.counter;
        const authRequired = ret.authRequired;
        // Wrap the Table Select around json_agg and row_to_json to generate an JSON array of objects
        // It will be named as localTableName (e.g. "_local_1_")
        // The result will be named to the querie's name
        // Edit: Added COALESCE(..., '[]'::json) to catch replace NULL with an empty array if subquery has no results
        const sql = `(SELECT COALESCE(json_agg(row_to_json("${localName}")), '[]'::json) FROM (${ret.sql}) "${localName}") "${query.name}"`;
        return {
            sql,
            counter,
            values,
            authRequired
        };
    }
}
exports.QueryBuilder = QueryBuilder;
