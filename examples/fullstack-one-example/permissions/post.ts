export = [
  {
    gqlTypeName: 'Post',
    readExpressions: {
      id: 'Anyone',
      title: 'Anyone',
      content: 'Anyone',
      owner: 'Anyone',
      images: 'Anyone',
      ownerSecret: 'Owner'
    },
    createViews: {
      me: {
        fields: ['title', 'content', 'ownerSecret', 'owner', 'images'],
        expressions: [{
          name: 'Anyone'
        }],
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
