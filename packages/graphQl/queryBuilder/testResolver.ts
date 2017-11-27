import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

import {
  getQueryResolver
} from './sqlGenerator/tableLoader';

export function getResolvers(gQlTypes, dbObject) {
  const queryResolver = getQueryResolver(gQlTypes, dbObject);

  const resolvers = {
    RootQuery: {
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
    }
  };

  return resolvers;
}
