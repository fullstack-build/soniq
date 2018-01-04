import {
  IExpressions,
  IPermissions
} from '../interfaces';

import findDirectiveIndex from './findDirectiveIndex';
import getArgumentByName from './getArgumentByName';
import getBasicSchema from './getBasicSchema';
import getRelationForeignGqlTypeName from './getRelationForeignGqlTypeName';
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

export default (classification: any, permissions: IPermissions, expressions: IExpressions, dbObject, $one) => {

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
  const customFields = {};
  const viewSchemaName = $one.getConfig('db').viewSchemaName;

  const filteredPermissions = mergeDeletePermissions(permissions);

  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', JSON.stringify(dbObject.exposedNames, null, 2));

  // iterate over permissions
  // each permission will become a view
  Object.values(filteredPermissions).forEach((permission) => {
    const gqlTypeName = permission.gqlTypeName;
    // console.log('>>>>>', gqlTypeName, permission);
    // TODO: CAN BE NULL => check and throw exception
    const table = tables[gqlTypeName];
    const nativeTable = dbObject.exposedNames[gqlTypeName];
    const tableName = nativeTable.tableName;
    const schemaName = nativeTable.schemaName;
    // const tableView = { ... table };
    const tableView = JSON.parse(JSON.stringify(table));
    let viewName = gqlTypeName + '_' + permission.name;
    if (permission.type === 'CREATE' || permission.type === 'UPDATE') {
      viewName = permission.type.toLocaleLowerCase() + '_' + viewName;
    }
    if (permission.type === 'DELETE') {
      viewName = permission.type.toLocaleLowerCase() + '_' + gqlTypeName;
    }
    tableView.name.value = viewName;

    if (permission.type === 'UPDATE' && permission.fields.indexOf('id') < 0) {
      throw new Error('A update permission is required to include field "id". Please check permission "' + permission.name + '".');
    }

    const view: any = {
      gqlTypeName,
      tableName,
      schemaName,
      viewName,
      viewSchemaName,
      type: 'VIEW',
      fields: [],
      expressions: [],
      operation: permission.type,
      permission
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
        typeNames: [],
        types: {},
        relationByField: {}
      };
    }

    // Add current type to list
    gQlTypes[gqlTypeName].types[viewName.toUpperCase()] = {
      viewName,
      viewSchemaName,
      typeName: viewName.toUpperCase(),
      gqlTypeName,
      fields: [],
      operation: permission.type,
      nativeFieldNames: []
    };

    if (permission.type === 'READ') {
      gQlTypes[gqlTypeName].typeNames.push(viewName.toUpperCase());
    } else {
      tableView.kind = 'GraphQLInputObjectType';
    }

    // filter required views
    // only allow fields with positive permissions
    tableView.fields = tableView.fields.filter((field) => {
      const fieldName = field.name.value;
      const isIncluded = permission.fields.indexOf(fieldName) >= 0;

      if (isIncluded && gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        gQlTypes[gqlTypeName].fieldNames.push(fieldName);
      }

      gQlTypes[gqlTypeName].types[viewName.toUpperCase()].fields.push(fieldName);

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

      const customDirectiveIndex = findDirectiveIndex(field, 'custom');
      const computedDirectiveIndex = findDirectiveIndex(field, 'computed');
      const relationDirectiveIndex = findDirectiveIndex(field, 'relation');

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
          typeName: gqlTypeName,
          fieldName,
          resolver: resolverName,
          params
        };

        // SQL expression returns always NULL for custom fields, to initialise them
        const fieldSql = `NULL::text AS "${fieldName}"`;

        fieldAlreadyAddedAsSpecialType = true;
        view.fields.push({
          name: fieldName,
          expression: fieldSql
        });

        // This field cannot be set with a generated mutation
        filterFieldsForMutation.push(fieldName);

        // Add native fields to gQlTypes
        gQlTypes[gqlTypeName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
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
          throw new Error('Expression `' + expressionName + '` does not exist. You used it in table `' + permission.gqlTypeName + '`.');
        }

        const expressionContext = {
          gqlTypeName: permission.gqlTypeName,
          table: `"${schemaName}"."${tableName}"`,
          tableName,
          schemaName,
          field: fieldName,
          view: `"${viewSchemaName}"."${viewName}"`,
          viewName,
          viewSchemaName
        };

        const fieldExpression = expressionsByName[expressionName].generate(expressionContext, params);
        // expression to SQL
        const fieldSql = `(${fieldExpression}) AS "${fieldName}"`;

        fieldAlreadyAddedAsSpecialType = true;
        view.fields.push({
          name: fieldName,
          expression: fieldSql
        });

        // This field cannot be set with a generated mutation
        filterFieldsForMutation.push(fieldName);

        // Add native fields to gQlTypes
        gQlTypes[gqlTypeName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
      }

      // field is relation
      if (relationDirectiveIndex !== -1) {
        const relationDirective = field.directives[relationDirectiveIndex];

        const relationName = getArgumentByName(relationDirective, 'name').value.value;

        const relationFieldName = fieldName + 'Id';

        const foreignGqlTypeName = getRelationForeignGqlTypeName(field);
        const foreignNativeTable = dbObject.exposedNames[foreignGqlTypeName];

        gQlTypes[gqlTypeName].relationByField[fieldName] = {
          relationName,
          foreignGqlTypeName,
          foreignTableName: foreignNativeTable.tableName,
          foreignSchemaName: foreignNativeTable.schemaName,
          relationType: getRelationType(field),
          columnName: relationFieldName
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

        gQlTypes[gqlTypeName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName + 'Id');
      }

      // add all normal fields (if not already added)
      if (!fieldAlreadyAddedAsSpecialType) {
        view.fields.push({
          name: fieldName,
          expression: `"${fieldName}"`
        });
        gQlTypes[gqlTypeName].types[viewName.toUpperCase()].nativeFieldNames.push(fieldName);
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
        throw new Error('Expression `' + expression.name + '` does not exist. You used it in table `' + permission.gqlTypeName + '`.');
      }
      // todo check if returnType is a boolean

      const expressionContext = {
        gqlTypeName: permission.gqlTypeName,
        table: `"${schemaName}"."${tableName}"`,
        tableName,
        schemaName,
        field: null,
        view: `"${viewSchemaName}"."${viewName}"`,
        viewName,
        viewSchemaName
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

      let returnType = gqlTypeName;

      if (permission.type === 'DELETE') {
        returnType = 'ID';
      }

      mutations.push({
        name: viewName.toString(),
        type: permission.type,
        inputType: viewName,
        returnType,
        typesEnumName: (gqlTypeName + '_TYPES').toUpperCase(),
        viewName,
        viewSchemaName
      });
    }

    // Add view to views
    views.push(view);

  });

  // build GraphQL gQlTypes based on DB views
  Object.values(gQlTypes).forEach((gQlType) => {
    // console.log('>>>>>>', JSON.stringify(gQlType, null, 2))

    const gqlTypeName = gQlType.gqlTypeName;
    const typesEnumName = (gqlTypeName + '_TYPES').toUpperCase();
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
      name: gqlTypeName.toString().toLowerCase() + 's',
      type: gqlTypeName,
      typesEnumName: (gqlTypeName + '_TYPES').toUpperCase()
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
    mutations,
    customFields
  };
};
