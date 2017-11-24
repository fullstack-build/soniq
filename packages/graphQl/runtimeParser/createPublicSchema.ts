import {
  IExpressions,
  IPermissions
} from '../interfaces';

import createUnionDefinition from './createUnionDefinition';
import findDirectiveIndex from './findDirectiveIndex';
import getArgumentByName from './getArgumentByName';
import getBasicSchema from './getBasicSchema';
import getRelationForeignTable from './getRelationForeignTable';
import getRelationType from './getRelationType';
import parseObjectArgument from './parseObjectArgument';
import arrayToNamedArray from './arrayToNamedArray';

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

  const tableUnions = {};
  const fusionViews: any = {};
  const views = [];
  const expressionsByName = arrayToNamedArray(expressions);
  const queries = [];

  // iterate over permissions
  // each permission will become a view
  Object.values(permissions).forEach((permission) => {

    const tableName = permission.table;
    // todo: CAN BE NULL => check and throw exception
    const table = tables[tableName];
    // const tableView = { ... table };
    const tableView = JSON.parse(JSON.stringify(table));
    const viewName = permission.table + '_' + permission.name;
    tableView.name.value = viewName;

    const view: any = {
      tableName,
      name: viewName,
      type: 'VIEW',
      fields: [],
      expressions: [],
    };

    // Create FusionView for Table if it not already exists
    if (fusionViews[tableName] == null) {
      fusionViews[tableName] = {
        name: tableName + '_Fusion',
        tableName,
        fieldNames: []
      };
    }

    // create unions array for table if not yet available
    tableUnions[tableName] = tableUnions[tableName] || [];
    // and push view
    tableUnions[tableName].push(viewName);

    // filter required views
    // only allow fields with positive permissions
    tableView.fields = tableView.fields.filter((field) => {
      const fieldName = field.name.value;
      const isIncluded = permission.fields.indexOf(fieldName) >= 0;

      if (isIncluded === true && fusionViews[tableName].fieldNames.indexOf(fieldName)) {
        fusionViews[tableName].fieldNames.push(fieldName);
      }

      return isIncluded;
    });

    // new object: each table leads to 0..n views based on permissions
    // rename table to view
    Object.values(tableView.directives).forEach((directive) => {
      if (directive.name.value === 'table') {
        directive.name.value = 'view';
      }
    });

    // Add view to GraphQl graphQlDocument
    graphQlDocument.definitions.push(tableView);

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
      }

      // field is relation
      if (relationDirectiveIndex !== -1) {
        const relationDirective = field.directives[relationDirectiveIndex];

        if (getRelationType(field) === 'ONE') {
          view.fields.push({
            name: fieldName,
            expression: fieldName + '_' + getRelationForeignTable(field) + '_id'
          });
        }
        fieldAlreadyAddedAsSpecialType = true;
      }

      // add all normal fields (if not already added)
      if (fieldAlreadyAddedAsSpecialType !== true) {
        view.fields.push({
          name: fieldName,
          expression: fieldName
        });
      }
    });

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

    // Add view to views
    views.push(view);

  });

  // build GraphQL FustionViews based on DB viewson DB views
  Object.values(fusionViews).forEach((tableFusion) => {

    const table = tables[tableFusion.tableName];
    // new object: GraphQL definition for fusionView
    // const tableView = { ...table };
    const tableView = JSON.parse(JSON.stringify(table));

    tableView.name.value = tableFusion.name;

    tableView.fields = tableView.fields.filter((field) => {
      return tableFusion.fieldNames.indexOf(field.name.value) >= 0;
    });

    // Rename table to view
    Object.values(tableView.directives).forEach((directive) => {
      if (directive.name.value === 'table') {
        directive.name.value = 'fusionView';
      }
    });

    // Add view to graphQlDocument
    graphQlDocument.definitions.push(tableView);

    // add fusionView to union of the table
    tableUnions[tableFusion.tableName].push(tableFusion.name);
  });

  // build GraphQl union definitions
  Object.entries(tableUnions).forEach((unionEntry) => {
    const tableName = unionEntry[0];
    const tableUnion = unionEntry[1];
    graphQlDocument.definitions.push(createUnionDefinition(tableName, tableUnion));

    queries.push({
      name: tableName.toString().toLowerCase() + 's',
      type: tableName,
    });
  });

  const basicSchema = getBasicSchema(queries);

  graphQlDocument.definitions = graphQlDocument.definitions.concat(basicSchema);

  return {
    document: graphQlDocument,
    views,
    viewFusions: fusionViews
  };
};
