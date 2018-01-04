export = [
  {
    name: 'Author',
    type: 'READ',
    gqlTypeName: 'User',
    fields: [
      'id', 'firstLetterOfUserName', 'stripeAccount', 'payload.data.title', 'payload.secret'
    ],
    expressions: [{
      name: 'Anyone',
    }],
  }, {
    type: 'READ',
    name: 'Me',
    gqlTypeName: 'User',
    fields: [
      'id', 'firstLetterOfUserName', 'username', 'email', 'posts', 'payload.data.content'
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
    gqlTypeName: 'User',
    fields: [
      'id', 'username', 'email', 'payload'
    ],
    expressions: [{
      name: 'Owner',
      params: {
        field: 'id',
      },
    }],
  }/*, {
    type: 'CREATE',
    name: 'Private',
    gqlTypeName: 'User',
    fields: [
      'id', 'username', 'email', 'type', 'privatePayload.data'
    ],
    expressions: [{
      name: 'Type',
      params: {
        value: 'private',
      },
    }],
  }, {
    type: 'CREATE',
    name: 'Business',
    gqlTypeName: 'User',
    fields: [
      'id', 'username', 'email', 'type', 'businessPayload'
    ],
    expressions: [{
      name: 'Type',
      params: {
        value: 'business',
      },
    }],
  }*/
];
