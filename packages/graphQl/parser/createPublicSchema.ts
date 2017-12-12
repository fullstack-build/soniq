import {
  IExpressions,
  IPermissions
} from '../interfaces';

import findDirectiveIndex from './findDirectiveIndex';
import getArgumentByName from './getArgumentByName';
import getBasicSchema from './getBasicSchema';
import getRelationForeignTable from './getRelationForeignTable';
import getRelationType from './getRelationType';
import parseObjectArgument from './parseObjectArgument';
import arrayToNamedArray from './arrayToNamedArray';
import getQueryArguments from './getQueryArguments';
import getTypesEnum from './getTypesEnum';
import getTypenamesField from './getTypenamesField';
import convertToInputType from './convertToInputType';
import mergeDeletePermissions from './mergeDeletePermissions';
import createIdField from './createIdField';
import createScalar from './createScalar';
import { log } from 'util';

import { introspectionQuery } from 'graphql';
import { graphiqlKoa } from 'apollo-server-koa/dist/koaApollo';

export default (classification: any, permissions: IPermissions, expressions: IExpressions) => {

  const {
    tables,
    otherDefinitions
  } = classification;

  // create new GraphQL document
  const graphQlDocument = {
    kind: 'Document',
    // definitions: [...otherDefinitions],
    definitions: JSON.parse(JSON.stringify(otherDefinitions))
  };

  // Add JSON Scalar
  graphQlDocument.definitions.push(createScalar('JSON'));

  const gQlTypes: any = {};
  const views = [];
  const expressionsByName = arrayToNamedArray(expressions);
  const queries = [];
  const mutations = [];

  const filteredPermissions = mergeDeletePermissions(permissions);

  // iterate over permissions
  // each permission will become a view
  Object.values(filteredPermissions).forEach((permission) => {
    const tableName = permission.table;
    // todo: CAN BE NULL => check and throw exception
    const table = tables[tableName];
    // const tableView = { ... table };
    const tableView = JSON.parse(JSON.stringify(table));
    let viewName = tableName + '_' + permission.name;
    if (permission.type === 'CREATE' || permission.type === 'UPDATE') {
      viewName = permission.type.toLocaleLowerCase() + '_' + viewName;
    }
    if (permission.type === 'DELETE') {
      viewName = permission.type.toLocaleLowerCase() + '_' + tableName;
    }
    tableView.name.value = viewName;

    if (permission.type === 'UPDATE' && permission.fields.indexOf('id') < 0) {
      throw new Error('A update permission is required to include field "id". Please check permission "' + permission.name + '".');
    }

    const view: any = {
      tableName,
      name: viewName,
      type: 'VIEW',
      fields: [],
      expressions: [],
      operation: permission.type,
      permission
    };

    // Create gQl Type for Table if it not already exists
    if (gQlTypes[tableName] == null) {
      gQlTypes[tableName] = {
        name: tableName,
        tableName,
        fieldNames: [],
        typeNames: [],
        types: {},
        relationByField: {}
      };
    }

    // Add current type to list
    gQlTypes[tableName].types[viewName.toUpperCase()] = {
      viewName,
      typeName: viewName.toUpperCase(),
      tableName,
      fields: [],
      operation: permission.type,
      nativeFieldNames: []
    };

    if (permission.type === 'READ') {
      gQlTypes[tableName].typeNames.push(viewName.toUpperCase());
    } else {
      tableView.kind = 'GraphQLInputObjectType';
    }

    // filter required views
    // only allow fields with positive permissions
    tableView.fields = tableView.fields.filter((field) => {
      const fieldName = field.name.value;
      const isIncluded = permission.fields.indexOf(fieldName) >= 0;

      if (isIncluded && gQlTypes[tableName].fieldNames.indexOf(fieldName) < 0) {
        gQlTypes[tableName].fieldNames.push(fieldName);
      }

      gQlTypes[tableName].types[viewName.toUpperCase()].fields.push(fieldName);

      return isIncluded;
    });

    // new object: each table leads to 0..n views based on permissions
    // rename table to view
    Object.values(tableView.directives).forEach((directive) => {
      if (directive.name.value === 'table') {
        directive.name.value = 'view';
      }
    });

    const filterFieldsForMutation = [];
    const addIdFieldsForMutation = [];

    // Get fields and it's expressions
    Object.values(tableView.fields).forEach((field) => {
      const fieldName = field.name.value;
      let fieldAlreadyAddedAsSpecialType = false;

      const computedDirectiveIndex = findDirectiveIndex(field, 'computed');
      const relationDirectiveIndex = findDirectiveIndex(field, 'relation');

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
          throw new Error('Expression `' + expressionName + '` does not exist. You used it in table `' + permission.table + '`.');
        }

        const expressionContext = {
          table: permission.table,
          field: fieldName,
          view: viewName,
        };

        const fieldExpression = expressionsByName[expressionName].generate(expressionContext, params);
        // expression to SQL
        const fieldSql = `(${fieldExpression}) AS "${fieldName}"`;

        fieldAlreadyAddedAsSpecialType = true;
        view.fields.push({
          name: fieldName,
          expression: fieldSql
        });

        // This field cannot be set with a mutation
        filterFieldsForMutation.push(fieldName);

        // Add native fields to gQlTypes
        gQlTypes[tableName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }

      // field is relation
      if (relationDirectiveIndex !== -1) {
        const relationDirective = field.directives[relationDirectiveIndex];

        const relationName = getArgumentByName(relationDirective, 'name').value.value;

        const relationFieldName = fieldName + '_' + getRelationForeignTable(field) + '_id';

        gQlTypes[tableName].relationByField[fieldName] = {
          relationName,
          foreignTableName: getRelationForeignTable(field),
          relationType: getRelationType(field),
          fieldName: relationFieldName
        };

        // This field cannot be set with a mutation
        filterFieldsForMutation.push(fieldName);

        if (getRelationType(field) === 'ONE') {
          view.fields.push({
            name: fieldName,
            expression: `"${relationFieldName}"`
          });

          // Add relation-field-name to GQL Input for mutating it
          addIdFieldsForMutation.push(relationFieldName);
        }
        fieldAlreadyAddedAsSpecialType = true;

        gQlTypes[tableName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName + '_' + getRelationForeignTable(field) + '_id');
      }

      // add all normal fields (if not already added)
      if (!fieldAlreadyAddedAsSpecialType) {
        view.fields.push({
          name: fieldName,
          expression: `"${fieldName}"`
        });
        gQlTypes[tableName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }
    });

    // Add _typenames field into READ Views
    if (permission.type === 'READ') {
      view.fields.push({
        name: '_typenames',
        expression: `ARRAY['${viewName.toUpperCase()}'] AS _typenames`
      });
    }

    // creates SQL expressions for permission
    Object.values(permission.expressions).forEach((expression) => {
      if (expressionsByName[expression.name] == null) {
        throw new Error('Expression `' + expression.name + '` does not exist. You used it in table `' + permission.table + '`.');
      }
      // todo check if returnType is a boolean

      const expressionContext = {
        table: permission.table,
        field: null,
        view: viewName,
      };

      const expressionSql = expressionsByName[expression.name].generate(expressionContext, expression.params || {});

      view.expressions.push(expressionSql);
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

    // Add view to GraphQl graphQlDocument
    if (permission.type === 'CREATE' || permission.type === 'UPDATE' || permission.type === 'DELETE') {
      // console.log('!!!!!!!!!!!!!!!!!!!!!!!!', JSON.stringify(tableView, null, 2))

      // const inputTypes = convertToInputType(tableView, otherDefinitions);

      tableView.kind = 'InputObjectTypeDefinition';

      graphQlDocument.definitions.push(tableView);

      let returnType = tableName;

      if (permission.type === 'DELETE') {
        returnType = 'ID';
      }

      mutations.push({
        name: viewName.toString(),
        type: permission.type,
        inputType: viewName,
        returnType,
        typesEnumName: (tableName + '_TYPES').toUpperCase(),
        viewName
      });
    }

    // Add view to views
    views.push(view);

  });

  // build GraphQL gQlTypes based on DB views
  Object.values(gQlTypes).forEach((gQlType) => {
    // console.log('>>>>>>', JSON.stringify(gQlType, null, 2))

    const tableName = gQlType.tableName;
    const typesEnumName = (tableName + '_TYPES').toUpperCase();
    const table = tables[gQlType.tableName];
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
        const foreignTypesEnumName = (gQlType.relationByField[field.name.value].foreignTableName + '_TYPES').toUpperCase();
        field.arguments = getQueryArguments(foreignTypesEnumName);
      }

      // Remove NonNullType because a field can be NULL if a user has no permissions
      if (field.type.kind === 'NonNullType') {
        field.type = field.type.type;
      }

      return field;
    });

    // Add _typenames field to type
    tableView.fields.push(getTypenamesField(typesEnumName));

    // Add types-enum definition of table to graphQlDocument
    graphQlDocument.definitions.push(getTypesEnum(typesEnumName, gQlType.typeNames));

    // Add table type to graphQlDocument
    graphQlDocument.definitions.push(tableView);

    queries.push({
      name: tableName.toString().toLowerCase() + 's',
      type: tableName,
      typesEnumName: (tableName + '_TYPES').toUpperCase()
    });

    /* Object.keys(gQlType.types).forEach((view, index) => {

    })); */
  });

  const basicSchema = getBasicSchema(queries, mutations);

  graphQlDocument.definitions = graphQlDocument.definitions.concat(basicSchema);

  return {
    document: graphQlDocument,
    views,
    gQlTypes,
    queries,
    mutations
  };
};
