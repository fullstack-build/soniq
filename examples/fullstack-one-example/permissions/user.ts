export = [
  {
    name: 'Author',
    type: 'READ',
    table: 'User',
    fields: [
      'id', 'firstLetterOfUserName',
    ],
    expressions: [{
      name: 'Anyone',
    }],
  }, {
    type: 'READ',
    name: 'Me',
    table: 'User',
    fields: [
      'id', 'username', 'email', 'posts',
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  },
];
