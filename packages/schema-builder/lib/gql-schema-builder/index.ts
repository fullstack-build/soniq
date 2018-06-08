import { IViews, IExpressions } from './interfaces';

import classifyUserDefinitions from './classifyUserDefinitions';
import createPublicSchema from './createPublicSchema';
import getCustomOperations from './getCustomOperations';

import {
  parse,
  print,
} from 'graphql';

import { parsers } from './parsers';

export function gqlSchemaBuilder(userSchema: any, views: IViews, expressions: IExpressions, dbObject, viewSchemaName, customParsers): any {

  const currentParsers = customParsers.slice().concat(parsers.slice());

  const classification = classifyUserDefinitions(userSchema);

  const {
    document,
    dbViews,
    gQlTypes,
    queries,
    mutations,
    customFields
  } = createPublicSchema(classification, views, expressions, dbObject, viewSchemaName, currentParsers);

  const { customQueries, customMutations } = getCustomOperations(classification);

  /* console.log('> NEW GQL:');
  console.log(print(document));
  console.log(JSON.stringify(document, null, 2));
  console.log('>');
  console.log('> ===================================================');
  console.log('>'); // */
  // console.log('> Views:', JSON.stringify(views, null, 2));
  // console.log('> Views:', JSON.stringify(views, null, 2));

  return { document, dbViews, gQlTypes, queries, mutations, customFields, customQueries, customMutations };

}
