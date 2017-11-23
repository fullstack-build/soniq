export = [
  {
    name: 'Author',
    type: 'READ',
    table: 'User',
    fields: [
      'id', 'firstLetterOfUserName',
    ],
    expressions: [{
      name: 'Authenticated',
    }],
  }, {
    type: 'READ',
    name: 'Me',
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
