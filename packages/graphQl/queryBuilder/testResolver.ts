import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

import {
  getQueryResolver
} from './sqlGenerator/read';

import {
  getMutationResolver
} from './sqlGenerator/mutate';

import {
  getInstance
} from '../../core';

export function getResolvers(gQlTypes, dbObject, queries, mutations) {
  const queryResolver = getQueryResolver(gQlTypes, dbObject);
  const mutationResolver = getMutationResolver(gQlTypes, dbObject, mutations);

  /* const one = getInstance();
  const pool = one.getDbPool();

  pool.query('SELECT * FROM pg_config').then((value) => {
    // tslint:disable-next-line:no-console
    console.log(value);
  }); */

  const resolvers = {
    Query: {
      users: (obj, args, context, info) => {
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(info, null, 2));
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(parseResolveInfo(info), null, 2));
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================');
        // tslint:disable-next-line:no-console
        console.log(queryResolver(obj, args, context, info).sql);

        // return [{id:13, firstLetterOfUserName: 'A'}];
        return [{
          id: 12,
          email: 'dustin@fullstack.build',
          _typenames: ['USER_ME']
        }, {
          id: 13,
          email: 'eugene@fullstack.build',
          firstLetterOfUserName: 'A',
          _typenames: ['USER_AUTHOR']
        }];
      },
      posts: (obj, args, context, info) => {
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(parseResolveInfo(info), null, 2));
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================');
        // tslint:disable-next-line:no-console
        console.log(queryResolver(obj, args, context, info).sql);
        // return [{id:13, firstLetterOfUserName: 'A'}];
        return [{
          id: 12,
          title: 'first Post',
          _typenames: ['POST_OWNER']
        }, {
          id: 13,
          title: 'second post',
          _typenames: ['POST_PUBLIC']
        }];
      }
    },
    Mutation: {
      create_post_ownercreates: (obj, args, context, info) => {
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(parseResolveInfo(info), null, 2));
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================');
        // tslint:disable-next-line:no-console
        console.log(mutationResolver(obj, args, context, info).sql);
        // tslint:disable-next-line:no-console
        console.log(queryResolver(obj, args, context, info).sql);
        // return [{id:13, firstLetterOfUserName: 'A'}];
        return {
          id: 12,
          title: 'first Post',
          _typenames: ['POST_OWNER']
        };
      },
      update_post_ownerupdates: (obj, args, context, info) => {
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(parseResolveInfo(info), null, 2));
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================');
        // tslint:disable-next-line:no-console
        console.log(mutationResolver(obj, args, context, info).sql);
        // tslint:disable-next-line:no-console
        console.log(queryResolver(obj, args, context, info).sql);
        // return [{id:13, firstLetterOfUserName: 'A'}];
        return {
          id: 12,
          title: 'first Post',
          _typenames: ['POST_OWNER']
        };
      }
    }
  };

  return resolvers;
}
