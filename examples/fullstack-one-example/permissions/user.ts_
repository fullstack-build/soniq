// TODO: Dustin: Create interface for permissions (or jsonshema to validate against)
export = [
  {
    gqlTypeName: "User",
    readExpressions: {
      id: "Anyone", // Kann auch ein Array sein (expressions werden mit OR verknüpft) // TODO: Dustin translate
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
