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
    name: 'OwnerCreate',
    type: 'CREATE',
    table: 'Post',
    fields: [
      'id', 'title', 'content', 'ownerSecret',
    ],
    expressions: [{
      name: 'Owner',
    }],
  },
  {
    name: 'OwnerUpdate',
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
    name: 'OwnerDelete',
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
    name: 'AdminDelete',
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
