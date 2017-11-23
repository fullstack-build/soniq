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
                firstLetterOfUserName: 'A',
                __type: 'User_Author'
            }];
        }
    },
    User_Me: {},
    User_Author: {
        // firstLetterOfUserName: () => {  return 'B' }
    },
    User_Fusion: {},
    User: {
        __resolveType(obj, context, info) {
            return obj.__type;
            // console.log(obj);
            /*if(obj.firstLetterOfUserName){
              return 'User_Author';
            }
            return 'User_Me';

            if(obj.email && obj.username){
              return 'User_Fusion';
            }

            if(obj.email){
              return 'User_Me';
            }

            return 'User_Fusion';*/
        }
    }
};

export default resolvers;
