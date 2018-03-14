import { IViews, IExpressions } from '../interfaces';

import classifyUserDefinitions from './classifyUserDefinitions';
import createPublicSchema from './createPublicSchema';
// import createPublicSchemaNew from './createPublicSchemaNew';
import getCustomOperations from './getCustomOperations';

import * as fs from 'fs';

import {
  parse,
  print,
} from 'graphql';

export function runtimeParser(userSchema: any, views: IViews, expressions: IExpressions, dbObject, viewSchemaName): any {

  const classification = classifyUserDefinitions(userSchema);
  // const oldData = createPublicSchema(classification, views, expressions, dbObject, viewSchemaName);

  // fs.writeFileSync(__dirname + '/1.json', JSON.stringify(oldData, null, 2), 'utf8');

  // const newData = createPublicSchemaNew(classification, views, expressions, dbObject, viewSchemaName);

  // fs.writeFileSync(__dirname + '/2.json', JSON.stringify(newData, null, 2), 'utf8');

  const {
    document,
    dbViews,
    gQlTypes,
    queries,
    mutations,
    customFields
  } = createPublicSchema(classification, views, expressions, dbObject, viewSchemaName);

  // console.log(JSON.stringify(document, null, 2));
  // console.log(JSON.stringify(dbViews, null, 2));

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
