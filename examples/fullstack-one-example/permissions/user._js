// TODO: Dustin: Create interface for permissions (or jsonshema to validate against)
/*
module.exports = [
  {
    gqlTypeName: "User",
    readExpressions: {
      id: "Anyone", // Can also be an array (expressions will be combined with OR)
      firstLetterOfUserName: "Anyone",
      posts: "Anyone",
      stripeAccount: "Anyone",
      "payload.title": "Anyone",
      "payload.content": "Anyone",
      "payload.secret": {
        name: "Owner",
        params: {
          field: "id"
        }
      },
      email: {
        name: "Owner",
        params: {
          field: "id"
        }
      }
    },
    createViews: {
      me: {
        fields: ["username", "email", "acceptedPrivacyTermsVersion", "acceptedPrivacyTermsAtInUTC"],
        expressions: [
          {
            name: "Anyone"
          }
        ]
      }
    },
    updateViews: {
      me: {
        fields: ["username", "email", "payload", "posts"],
        expressions: [
          {
            name: "Owner",
            params: {
              field: "id"
            }
          }
        ]
      }
    },
    deleteExpressions: [
      {
        name: "Owner",
        params: {
          field: "id"
        }
      }
    ]
  }
];
*/
