module.exports = [
  {
    gqlTypeName: "Photo",
    readExpressions: {
      id: ["Anyone"],
      name: ["Anyone"]
    },
    createViews: {
      me: {
        fields: ["name"],
        expressions: [
          {
            name: "Anyone"
          }
        ]
      }
    }
  }
];
