import { IPermissions, IExpressions } from '../interfaces';

import classifyUserDefinitions from './classifyUserDefinitions';
import createPublicSchema from './createPublicSchema';

import {
  parse,
  print,
} from 'graphql';

export function runtimeParser(userSchema: any, permissions: IPermissions, expressions: IExpressions): any {

  const classification = classifyUserDefinitions(userSchema);
  const { document, views, viewFusions } = createPublicSchema(classification, permissions, expressions);

  // console.log('doc', JSON.stringify(document, null, 2));

  // console.log(print(document), views, viewFusions);
/*
  console.log('> NEW GQL:');
  console.log(print(document));
  console.log('>');
  console.log('> ===================================================');
  console.log('>');
  console.log('> Views:', JSON.stringify(views, null, 2));
  console.log('>');
  console.log('> ===================================================');
  console.log('>');
  console.log('> Fusions:', JSON.stringify(viewFusions, null, 2));
*/
  return { document, views, viewFusions };

}
