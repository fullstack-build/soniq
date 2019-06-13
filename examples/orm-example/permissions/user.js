module.exports = [
  {
    gqlTypeName: "User",
    readExpressions: {
      id: ["Anyone"],
      firstname: ["Anyone"],
      lastname: ["Anyone"],
      size: ["Anyone"],
      photo: ["Anyone"],
      tasks: ["Anyone"],
    },
    createViews: {
      me: {
        fields: ["firstname", "lastname", "size", "photo"],
        expressions: [
          {
            name: "Anyone"
          }
        ]
      }
    }
  }
];
