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
];
