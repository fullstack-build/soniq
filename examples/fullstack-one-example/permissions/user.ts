export default [
  {
    type: 'READ',
    name: 'Author',
    table: 'User',
    fields: [
      'id', 'username',
    ],
    expressions: ['Authenticated'],
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
