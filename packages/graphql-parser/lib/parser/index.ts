import { IViews, IExpressions } from '../interfaces';

import classifyUserDefinitions from './classifyUserDefinitions';
import createPublicSchema from './createPublicSchema';
import getCustomOperations from './getCustomOperations';

import {
  parse,
  print,
} from 'graphql';

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

export function runtimeParser(userSchema: any, views: IViews, expressions: IExpressions, dbObject, viewSchemaName, customParsers): any {

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
  console.log('>');
  console.log('> ===================================================');
  console.log('>'); // */
  // console.log('> Views:', JSON.stringify(views, null, 2));
  // console.log('> Views:', JSON.stringify(views, null, 2));

  return { document, dbViews, gQlTypes, queries, mutations, customFields, customQueries, customMutations };

}
