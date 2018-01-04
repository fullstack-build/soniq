import { IViews, IExpressions } from '../interfaces';

import classifyUserDefinitions from './classifyUserDefinitions';
import createPublicSchema from './createPublicSchema';
import getCustomOperations from './getCustomOperations';

import {
  parse,
  print,
} from 'graphql';

export function runtimeParser(userSchema: any, permissions: IViews, expressions: IExpressions, dbObject, $one): any {

  const classification = classifyUserDefinitions(userSchema);
  const {
    document,
    dbViews,
    gQlTypes,
    queries,
    mutations,
    customFields
  } = createPublicSchema(classification, permissions, expressions, dbObject, $one);

  const { customQueries, customMutations } = getCustomOperations(classification);

  // console.log(customQueries, customMutations, customFields)

  // console.log('doc', JSON.stringify(document, null, 2));

  // console.log(print(document), views, viewFusions);
  // console.log(print(document));

  /* console.log('> NEW GQL:');
  console.log(print(document));
  console.log('>');
  console.log('> ===================================================');
  console.log('>'); // */
  // console.log('> Views:', JSON.stringify(views, null, 2));
  // console.log('> Views:', JSON.stringify(views, null, 2));

  return { document, dbViews, gQlTypes, queries, mutations, customFields, customQueries, customMutations };

}
