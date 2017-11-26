import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

const resolvers = {
  RootQuery: {
    users: (obj, args, context, info) => {
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify(info, null, 2));

      // return [{id:13, firstLetterOfUserName: 'A'}];
      return [{
        id: 12,
        email: 'dustin@fullstack.build',
        __type: 'User_Me'
      }, {
        id: 13,
        email: 'eugene@fullstack.build',
        firstLetterOfUserName: 'A',
        __type: 'User_Author'
      }];
    },
    posts: (obj, args, context, info) => {
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify(info, null, 2));

      // return [{id:13, firstLetterOfUserName: 'A'}];
      return [{
        id: 12,
        email: 'dustin@fullstack.build',
        __type: 'User_Me'
      }, {
        id: 13,
        email: 'eugene@fullstack.build',
        firstLetterOfUserName: 'A',
        __type: 'User_Author'
      }];
    }
  }
};

export default resolvers;
