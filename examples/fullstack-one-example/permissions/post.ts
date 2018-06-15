export = [
  {
    gqlTypeName: 'Post',
    readExpressions: {
      id: ['Admin'],
      title: 'Admin',
      content: 'Admin',
      owner: 'Admin',
      images: 'Admin',
      ownerSecret: [{name: 'Admin'}]
    },
    createViews: {
      me: {
        fields: ['title', 'content', 'ownerSecret', 'owner', 'images'],
        expressions: [{
          name: 'Owner'
        }],
        returnOnlyId: true
      }
    },
    updateViews: {
      me: {
        fields: ['id', 'title', 'content', 'ownerSecret', 'images'],
        expressions: [{
          name: 'Owner'
        }],
      }
    },
    deleteExpressions: [{
      name: 'Owner'
    }]
  }
];
