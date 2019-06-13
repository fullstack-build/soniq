module.exports = [
  {
    gqlTypeName: "Task",
    readExpressions: {
      id: ["Anyone"],
      title: ["Anyone"],
      user: ["Anyone"]
    },
    createViews: {
      me: {
        fields: ["title", "user"],
        expressions: [
          {
            name: "Anyone"
          }
        ]
      }
    }
  }
];
