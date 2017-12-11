export = [
  {
    name: 'Public',
    type: 'READ',
    table: 'Post',
    fields: [
      'id', 'title', 'content', 'owner',
    ],
    expressions: [{
      name: 'Anyone',
    }],
  },
  {
    name: 'Owner',
    type: 'READ',
    table: 'Post',
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
    table: 'Post',
    fields: [
      'id', 'title', 'content', 'ownerSecret', 'owner'
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'Owner',
    type: 'UPDATE',
    table: 'Post',
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
    table: 'Post',
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
    table: 'Post',
    fields: [
      'id',
    ],
    expressions: [{
      name: 'Admin',
    }],
  },
];
