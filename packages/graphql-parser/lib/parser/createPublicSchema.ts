
import {
  IExpressions,
  IViews
} from '../interfaces';

import getBasicSchema from './getBasicSchema';
import arrayToNamedArray from './arrayToNamedArray';
import getQueryArguments from './getQueryArguments';
import getViewsEnum from './getViewsEnum';
import getViewnamesField from './getViewnamesField';
import mergeDeleteViews from './mergeDeleteViews';
import getViewName from './getViewName';
import {
  _
} from 'lodash';

import * as jsonParser from './mods/json';
import * as idParser from './mods/id';
import * as computedParser from './mods/computed';
import * as customParser from './mods/custom';
import * as relationParser from './mods/relation';
import * as defaultParser from './mods/default';
import * as viewnamesParser from './mods/viewnames';
import * as expressionsParser from './mods/expressions';
import * as mutationsParser from './mods/mutations';

const parsers = [
  jsonParser,
  idParser,
  computedParser,
  customParser,
  relationParser,
  defaultParser,
  viewnamesParser,
  expressionsParser,
  mutationsParser
];

import {
  introspectionQuery
} from 'graphql';

const JSON_SPLIT = '.';

export default (classification: any, views: IViews, expressions: IExpressions, dbObject, viewSchemaName) => {

  const {
    tables,
    otherDefinitions
  } = classification;

  // getFromMigrationDbMeta new GraphQL document
  let graphQlDocument = {
    kind: 'Document',
    definitions: JSON.parse(JSON.stringify(otherDefinitions))
  };

  parsers.forEach((parser: any) => {
    if (parser.init != null) {
      parser.init(graphQlDocument);
    }
  });

  const gQlTypes: any = {};
  const dbViews = [];
  const expressionsByName = arrayToNamedArray(expressions);
  let queries = [];
  let mutations = [];
  let customFields = {};

  // Delete-Views can only include the id field. Thus there is no sense in having multiple delete views.
  // They can be merged to one by joining the expression arrays.
  const filteredViews = mergeDeleteViews(views);

  // iterate over views
  // each view will become a view
  Object.values(filteredViews).forEach((view) => {
    if (view.gqlTypeName == null) {
      throw new Error('`gqlTypeName` is missing in a view.');
    }
    const gqlTypeName = view.gqlTypeName;
    const nativeTable = dbObject.exposedNames[gqlTypeName];
    const tableName = nativeTable.tableName;
    const schemaName = nativeTable.schemaName;
    const tableView = JSON.parse(JSON.stringify(tables[gqlTypeName]));
    const viewName = getViewName(view);
    view.viewName = viewName;
    view.tableName = tableName;
    tableView.name.value = viewName;

    if (view.type === 'UPDATE' && view.fields.indexOf('id') < 0) {
      throw new Error('A update view is required to include field "id". Please check view "' + view.gqlTypeName + '".');
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
      operation: view.type
    };

    // Create gQl Type for Table if it not already exists
    if (gQlTypes[gqlTypeName] == null) {
      gQlTypes[gqlTypeName] = {
        gqlTypeName,
        fieldNames: [],
        viewNames: [],
        authViewNames: [],
        noAuthViewNames: [],
        views: {},
        relationByField: {}
      };
    }

    // Add current type to list
    gQlTypes[gqlTypeName].views[viewName] = {
      viewName,
      viewSchemaName,
      operation: view.type,
      nativeFieldNames: []
    };

    if (view.type === 'READ') {
      gQlTypes[gqlTypeName].viewNames.push(viewName);
      gQlTypes[gqlTypeName].noAuthViewNames.push(viewName);
    } else {
      tableView.kind = 'GraphQLInputObjectType';
    }

    // filter required dbViews
    // only allow fields which are included in the schema
    const tableViewFields = tableView.fields;
    tableView.fields = [];

    // rename table to view
    Object.values(tableView.directives).forEach((directive: any) => {
      if (directive.name.value === 'table') {
        directive.name.value = 'view';
      }
    });

    const ctx = {
      view,
      tableView,
      gQlTypes,
      dbView,
      customFields,
      queries,
      mutations,
      expressionsByName,
      schemaName,
      viewSchemaName,
      dbObject,
      graphQlDocument
    };

    // Get fields and it's expressions
    Object.values(tableViewFields).forEach((field: any) => {
      parsers.some((parser: any) => {
        if (parser.parseField != null) {
          return parser.parseField(field, ctx);
        }
        return false;
      });
    });

    parsers.forEach((parser: any) => {
      if (parser.parseView != null) {
        parser.parseView(ctx);
      }
    });

    // Add dbView to dbViews
    dbViews.push(ctx.dbView);
    mutations = ctx.mutations;
    queries = ctx.queries;
    graphQlDocument = ctx.graphQlDocument;
    customFields = ctx.customFields;

  });

  // build GraphQL gQlTypes based on DB dbViews
  Object.values(gQlTypes).forEach((gQlType: any) => {

    const gqlTypeName = gQlType.gqlTypeName;
    const viewsEnumName = (gqlTypeName + '_VIEWS').toUpperCase();
    const table = tables[gQlType.gqlTypeName];

    // new object: GraphQL definition for fusionView
    const tableView = JSON.parse(JSON.stringify(table));

    tableView.name.value = gQlType.gqlTypeName;

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
