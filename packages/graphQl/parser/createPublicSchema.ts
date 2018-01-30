import {
  IExpressions,
  IViews
} from '../interfaces';

import findDirectiveIndex from './findDirectiveIndex';
import getArgumentByName from './getArgumentByName';
import getBasicSchema from './getBasicSchema';
import getRelationForeignGqlTypeName from './getRelationForeignGqlTypeName';
import getRelationType from './getRelationType';
import parseObjectArgument from './parseObjectArgument';
import arrayToNamedArray from './arrayToNamedArray';
import getQueryArguments from './getQueryArguments';
import getViewsEnum from './getViewsEnum';
import getViewnamesField from './getViewnamesField';
import convertToInputType from './convertToInputType';
import mergeDeleteViews from './mergeDeleteViews';
import createIdField from './createIdField';
import createIdArrayField from './createIdArrayField';
import createScalar from './createScalar';
import getJsonObjectBuilderExpression from './getJsonObjectBuilderExpression';
import { log } from 'util';
import { _ } from 'lodash';

import { introspectionQuery } from 'graphql';
import { graphiqlKoa } from 'apollo-server-koa/dist/koaApollo';

const JSON_SPLIT = '.';

export default (classification: any, views: IViews, expressions: IExpressions, dbObject, $one) => {

  const {
    tables,
    otherDefinitions
  } = classification;

  // getFromMigrationDbMeta new GraphQL document
  const graphQlDocument = {
    kind: 'Document',
    // definitions: [...otherDefinitions],
    definitions: JSON.parse(JSON.stringify(otherDefinitions))
  };

  // Add JSON Scalar
  graphQlDocument.definitions.push(createScalar('JSON'));

  const gQlTypes: any = {};
  const dbViews = [];
  const expressionsByName = arrayToNamedArray(expressions);
  const queries = [];
  const mutations = [];
  const customFields = {};
  const viewSchemaName = $one.getConfig('db').viewSchemaName;

  const filteredViews = mergeDeleteViews(views);

  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', JSON.stringify(dbObject.exposedNames, null, 2));

  // iterate over views
  // each view will become a view
  Object.values(filteredViews).forEach((view) => {
    const gqlTypeName = view.gqlTypeName;
    // console.log('>>>>>', gqlTypeName, view);
    // TODO: CAN BE NULL => check and throw exception
    const table = tables[gqlTypeName];
    const nativeTable = dbObject.exposedNames[gqlTypeName];
    const tableName = nativeTable.tableName;
    const schemaName = nativeTable.schemaName;
    // const tableView = { ... table };
    const tableView = JSON.parse(JSON.stringify(table));
    let viewName = gqlTypeName + '_' + view.name;
    if (view.type === 'CREATE' || view.type === 'UPDATE') {
      viewName = view.type.toLocaleLowerCase() + '_' + viewName;
    }
    if (view.type === 'DELETE') {
      viewName = view.type.toLocaleLowerCase() + '_' + gqlTypeName;
    }
    tableView.name.value = viewName;

    if (view.type === 'UPDATE' && view.fields.indexOf('id') < 0) {
      throw new Error('A update view is required to include field "id". Please check view "' + view.name + '".');
    }

    const dbView: any = {
      gqlTypeName,
      tableName,
      schemaName,
      viewName,
      viewSchemaName,
      type: 'VIEW',
      fields: [],
      expressions: [],
      operation: view.type,
      view
    };

    // Create gQl Type for Table if it not already exists
    if (gQlTypes[gqlTypeName] == null) {
      gQlTypes[gqlTypeName] = {
        name: gqlTypeName,
        gqlTypeName,
        tableName,
        schemaName,
        viewName,
        viewSchemaName,
        fieldNames: [],
        viewNames: [],
        authViewNames: [],
        noAuthViewNames: [],
        views: {},
        relationByField: {}
      };
    }

    // Add current type to list
    gQlTypes[gqlTypeName].views[viewName.toUpperCase()] = {
      viewName,
      viewSchemaName,
      typeName: viewName.toUpperCase(),
      gqlTypeName,
      fields: [],
      operation: view.type,
      nativeFieldNames: [],
      jsonFieldNames: []
    };

    if (view.type === 'READ') {
      gQlTypes[gqlTypeName].viewNames.push(viewName.toUpperCase());
      gQlTypes[gqlTypeName].noAuthViewNames.push(viewName.toUpperCase());
    } else {
      tableView.kind = 'GraphQLInputObjectType';
    }

    const jsonFields = {};
    const filterFieldsForMutation = [];

    if (view.type ===  'CREATE' && view.fields.indexOf('id') < 0) {
      view.fields.push('id');
      filterFieldsForMutation.push('id');
    }

    // filter required dbViews
    // only allow fields with positive view views
    tableView.fields = tableView.fields.filter((field) => {
      const fieldName = field.name.value;
      let isIncluded = view.fields.indexOf(fieldName) >= 0;

      if (!isIncluded && view.type === 'READ') {
        Object.values(view.fields).forEach((viewFieldName) => {
          if (viewFieldName.startsWith(`${fieldName}${JSON_SPLIT}`)) {
            isIncluded = true;

            if (jsonFields[fieldName] == null) {
              jsonFields[fieldName] = [];
            }

            jsonFields[fieldName].push(viewFieldName);
          }
        });
      }

      if (isIncluded && gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        gQlTypes[gqlTypeName].fieldNames.push(fieldName);
      }

      gQlTypes[gqlTypeName].views[viewName.toUpperCase()].fields.push(fieldName);

      return isIncluded;
    });

    // new object: each table leads to 0..n dbViews based on views
    // rename table to view
    Object.values(tableView.directives).forEach((directive) => {
      if (directive.name.value === 'table') {
        directive.name.value = 'view';
      }
    });

    const addIdFieldsForMutation = [];
    const addIdArrayFieldsForMutation = [];

    // Get fields and it's expressions
    Object.values(tableView.fields).forEach((field) => {
      const fieldName = field.name.value;
      let fieldAlreadyAddedAsSpecialType = false;

      if (fieldName === 'id' && view.type === 'CREATE' && field.type.kind === 'NonNullType') {
        field.type = field.type.type;
      }

      const jsonDirectiveIndex = findDirectiveIndex(field, 'json');
      const customDirectiveIndex = findDirectiveIndex(field, 'custom');
      const computedDirectiveIndex = findDirectiveIndex(field, 'computed');
      const relationDirectiveIndex = findDirectiveIndex(field, 'relation');

      if (jsonDirectiveIndex !== -1) {

        if (view.type === 'READ') {
          if (jsonFields[fieldName] != null) {
            fieldAlreadyAddedAsSpecialType = true;

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

            dbView.fields.push({
              name: fieldName,
              expression: jsonExpression
            });
            gQlTypes[gqlTypeName].views[viewName.toUpperCase()].jsonFieldNames.push(fieldName);
          }
        } else {
          field.type.name.value = field.type.name.value + 'Input';
        }
      }

      // field is expression
      if (customDirectiveIndex !== -1) {
        const customDirective = field.directives[customDirectiveIndex];

        const resolverName = getArgumentByName(customDirective, 'resolver').value.value;
        const paramsNode = getArgumentByName(customDirective, 'params');
        let params = {};

        if (paramsNode != null) {
          params = parseObjectArgument(paramsNode);
        }

        const fieldKey = `${gqlTypeName}_${fieldName}`;

        // Add field to custom fields for resolving it seperate
        customFields[fieldKey] = {
          type: 'Field',
          gqlTypeName,
          fieldName,
          resolver: resolverName,
          params
        };

        // SQL expression returns always NULL for custom fields, to initialise them
        const fieldSql = `NULL::text AS "${fieldName}"`;

        fieldAlreadyAddedAsSpecialType = true;
        dbView.fields.push({
          name: fieldName,
          expression: fieldSql
        });

        // This field cannot be set with a generated mutation
        filterFieldsForMutation.push(fieldName);

        // Add native fields to gQlTypes
        gQlTypes[gqlTypeName].views[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }

      // field is expression
      if (computedDirectiveIndex !== -1) {
        const computedDirective = field.directives[computedDirectiveIndex];

        const expressionName = getArgumentByName(computedDirective, 'expression').value.value;
        const paramsNode = getArgumentByName(computedDirective, 'params');
        let params = {};

        if (paramsNode != null) {
          params = parseObjectArgument(paramsNode);
        }

        if (expressionsByName[expressionName] == null) {
          throw new Error('Expression `' + expressionName + '` does not exist. You used it in table `' + view.gqlTypeName + '`.');
        }

        const expressionContext = {
          gqlTypeName: view.gqlTypeName,
          table: `"${schemaName}"."${tableName}"`,
          tableName,
          schemaName,
          field: fieldName,
          view: `"${viewSchemaName}"."${viewName}"`,
          viewName,
          viewSchemaName,
          currentUserId: () => {
            gQlTypes[gqlTypeName].authViewNames.push(viewName.toUpperCase());
            const viewIndex = gQlTypes[gqlTypeName].noAuthViewNames.indexOf(viewName.toUpperCase());
            if (viewIndex >= 0) {
              gQlTypes[gqlTypeName].noAuthViewNames.splice(viewIndex, 1);
            }

            return '_meta.current_user_id()';
          }
        };

        const fieldExpression = expressionsByName[expressionName].generate(expressionContext, params);
        // expression to SQL
        const fieldSql = `(${fieldExpression}) AS "${fieldName}"`;

        fieldAlreadyAddedAsSpecialType = true;
        dbView.fields.push({
          name: fieldName,
          expression: fieldSql
        });

        // This field cannot be set with a generated mutation
        filterFieldsForMutation.push(fieldName);

        // Add native fields to gQlTypes
        gQlTypes[gqlTypeName].views[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }

      // field is relation
      if (relationDirectiveIndex !== -1) {
        const relationDirective = field.directives[relationDirectiveIndex];

        const relationName = getArgumentByName(relationDirective, 'name').value.value;

        const relationConnections = dbObject.relations[relationName];

        const relationConnectionsArray = Object.values(relationConnections);

        // Determine which relation is the foreign one to get the correct columnName
        const foreignRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[1] : relationConnectionsArray[0];

        // Determine which relation is the own one to get the correct columnName
        const ownRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[0] : relationConnectionsArray[1];

        const relationFieldName = fieldName + 'Id';

        const foreignGqlTypeName = getRelationForeignGqlTypeName(field);
        const foreignNativeTable = dbObject.exposedNames[foreignGqlTypeName];
        if (foreignNativeTable == null) {
          throw new Error(`Unable to find database table for name GraphQL type name '${foreignGqlTypeName}'.`);
        }

        gQlTypes[gqlTypeName].relationByField[fieldName] = {
          relationName,
          foreignGqlTypeName,
          foreignTableName: foreignNativeTable.tableName,
          foreignSchemaName: foreignNativeTable.schemaName,
          relationType: ownRelation.type,
          columnName: relationFieldName
        };

        // This field cannot be set with a mutation
        filterFieldsForMutation.push(fieldName);

        if (ownRelation.columnName != null) {
          dbView.fields.push({
            name: fieldName,
            expression: `"${ownRelation.columnName}"`
          });

          // Add relation-field-name to GQL Input for mutating it
          if (foreignRelation.type === 'MANY' && ownRelation.type === 'MANY') {
            // In case of ManyToMany it's an array
            addIdArrayFieldsForMutation.push(ownRelation.columnName);
          } else {
            // In case of ManyToOne it is an id
            addIdFieldsForMutation.push(ownRelation.columnName);
          }

          gQlTypes[gqlTypeName].views[viewName.toUpperCase()].nativeFieldNames.push(ownRelation.columnName);
        }

        fieldAlreadyAddedAsSpecialType = true;
      }

      // add all normal fields (if not already added)
      if (!fieldAlreadyAddedAsSpecialType) {
        dbView.fields.push({
          name: fieldName,
          expression: `"${fieldName}"`
        });
        gQlTypes[gqlTypeName].views[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }
    });

    // Add _viewnames field into READ Views
    if (view.type === 'READ') {
      dbView.fields.push({
        name: '_viewnames',
        expression: `ARRAY['${viewName.toUpperCase()}'] AS _viewnames`
      });
    }

    // creates SQL expressions for view
    Object.values(view.expressions).forEach((expression) => {
      if (expressionsByName[expression.name] == null) {
        throw new Error('Expression `' + expression.name + '` does not exist. You used it in table `' + view.gqlTypeName + '`.');
      }
      // TODO: check if returnType is a boolean

      const expressionContext = {
        gqlTypeName: view.gqlTypeName,
        table: `"${schemaName}"."${tableName}"`,
        tableName,
        schemaName,
        field: null,
        view: `"${viewSchemaName}"."${viewName}"`,
        viewName,
        viewSchemaName,
        currentUserId: () => {
          gQlTypes[gqlTypeName].authViewNames.push(viewName.toUpperCase());
          const viewIndex = gQlTypes[gqlTypeName].noAuthViewNames.indexOf(viewName.toUpperCase());
          if (viewIndex >= 0) {
            gQlTypes[gqlTypeName].noAuthViewNames.splice(viewIndex, 1);
          }

          return '_meta.current_user_id()';
        }
      };

      const expressionSql = expressionsByName[expression.name].generate(expressionContext, expression.params || {});

      dbView.expressions.push(expressionSql);
    });

    // filter input fields
    // only allow fields that are mutable
    tableView.fields = tableView.fields.filter((field) => {
      const fieldName = field.name.value;
      const isIncluded = filterFieldsForMutation.indexOf(fieldName) >= 0;

      return !isIncluded;
    });

    // Add relation fields for mutations
    Object.values(addIdFieldsForMutation).forEach((fieldName) => {
      tableView.fields.push(createIdField(fieldName));
    });

    // Add relation array fields for mutations
    Object.values(addIdArrayFieldsForMutation).forEach((fieldName) => {
      tableView.fields.push(createIdArrayField(fieldName));
    });

    // Add view to GraphQl graphQlDocument
    if (view.type === 'CREATE' || view.type === 'UPDATE' || view.type === 'DELETE') {
      // console.log('!!!!!!!!!!!!!!!!!!!!!!!!', JSON.stringify(tableView, null, 2))

      // const inputTypes = convertToInputType(tableView, otherDefinitions);

      tableView.kind = 'InputObjectTypeDefinition';

      graphQlDocument.definitions.push(tableView);

      let returnType = gqlTypeName;

      if (view.type === 'DELETE') {
        returnType = 'ID';
      }

      mutations.push({
        name: viewName.toString(),
        type: view.type,
        inputType: viewName,
        returnType,
        viewsEnumName: (gqlTypeName + '_VIEWS').toUpperCase(),
        viewName,
        viewSchemaName
      });
    }

    // Add dbView to dbViews
    dbViews.push(dbView);

  });

  // build GraphQL gQlTypes based on DB dbViews
  Object.values(gQlTypes).forEach((gQlType) => {
    // console.log('>>>>>>', JSON.stringify(gQlType, null, 2))

    const gqlTypeName = gQlType.gqlTypeName;
    const viewsEnumName = (gqlTypeName + '_VIEWS').toUpperCase();
    const table = tables[gQlType.gqlTypeName];
    // new object: GraphQL definition for fusionView
    // const tableView = { ...table };
    const tableView = JSON.parse(JSON.stringify(table));

    tableView.name.value = gQlType.name;

    // Filter fields for gqlDefinition of the table
    tableView.fields = tableView.fields.filter((field) => {
      return gQlType.fieldNames.indexOf(field.name.value) >= 0;
    });

    // Add arguments to relation fields
    tableView.fields = tableView.fields.map((field, key) => {
      if (gQlType.relationByField[field.name.value]) {
        const foreignTypesEnumName = (gQlType.relationByField[field.name.value].foreignTableName + '_VIEWS').toUpperCase();
        field.arguments = getQueryArguments(foreignTypesEnumName);
      }

      // Remove NonNullType because a field can be NULL if a user has no views
      if (field.type.kind === 'NonNullType') {
        field.type = field.type.type;
      }

      return field;
    });

    // Add _viewnames field to type
    tableView.fields.push(getViewnamesField(viewsEnumName));

    // Add views-enum definition of table to graphQlDocument
    graphQlDocument.definitions.push(getViewsEnum(viewsEnumName, gQlType.viewNames));

    // Add table type to graphQlDocument
    graphQlDocument.definitions.push(tableView);

    queries.push({
      name: gqlTypeName.toString().toLowerCase() + 's',
      type: gqlTypeName,
      viewsEnumName: (gqlTypeName + '_VIEWS').toUpperCase()
    });

    /* Object.keys(gQlType.views).forEach((view, index) => {

    })); */
  });

  const basicSchema = getBasicSchema(queries, mutations);

  graphQlDocument.definitions = graphQlDocument.definitions.concat(basicSchema);

  return {
    document: graphQlDocument,
    dbViews,
    gQlTypes,
    queries,
    mutations,
    customFields
  };
};
