export = [
  {
    name: 'Author',
    type: 'READ',
    table: 'User',
    fields: [
      'id', 'firstLetterOfUserName', 'payload',
    ],
    expressions: [{
      name: 'Anyone',
    }],
  }, {
    type: 'READ',
    name: 'Me',
    table: 'User',
    fields: [
      'id', 'firstLetterOfUserName', 'username', 'email', 'posts', 'payload',
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  },
];
