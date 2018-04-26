export = [
  {
    name: 'Public',
    type: 'READ',
    gqlTypeName: 'Post',
    fields: [
      'id', 'title', 'content', 'owner', 'images'
    ],
    expressions: [{
      name: 'Anyone',
    }],
  },
  {
    name: 'Owner',
    type: 'READ',
    gqlTypeName: 'Post',
    fields: [
      'id', 'title', 'content', 'owner', 'ownerSecret',
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'Owner',
    type: 'CREATE',
    gqlTypeName: 'Post',
    fields: [
      'title', 'content', 'ownerSecret', 'owner', 'images'
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'Owner',
    type: 'UPDATE',
    gqlTypeName: 'Post',
    fields: [
      'id', 'title', 'content', 'ownerSecret',
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'Owner',
    type: 'DELETE',
    gqlTypeName: 'Post',
    fields: [
      'id',
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'Admin',
    type: 'DELETE',
    gqlTypeName: 'Post',
    fields: [
      'id',
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
];
