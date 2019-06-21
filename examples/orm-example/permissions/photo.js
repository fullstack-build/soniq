module.exports = [
  {
    gqlTypeName: "Photo",
    readExpressions: {
      id: ["Anyone"],
      name: ["Anyone"],
      text: ["Anyone"],
      count: ["Anyone"]
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
