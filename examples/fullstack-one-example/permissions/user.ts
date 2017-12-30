export = [
  {
    name: 'Author',
    type: 'READ',
    table: 'User',
    fields: [
      'id', 'firstLetterOfUserName', 'payload', 'stripeAccount'
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
    name: 'Me',
    table: 'User',
    fields: [
      'id', 'username', 'email', 'payload'
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  },
];
