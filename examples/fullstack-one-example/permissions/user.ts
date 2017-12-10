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
      'id', 'firstLetterOfUserName', 'username', 'email', 'posts',
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  }, {
    type: 'UPDATE',
    name: 'UpdateMe',
    table: 'User',
    fields: [
      'id', 'username', 'email',
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  },
];
