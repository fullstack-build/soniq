module.exports = [
  {
    gqlTypeName: "User",
    readExpressions: {
      id: ["Anyone"],
      firstname: ["Anyone"],
      lastname: ["Anyone"],
      size: [{ name: "Owner", params: { field: "id" } }],
      photo: ["Anyone"],
      tasks: ["Anyone"],
      prinzipalRepresent: ["Anyone"],
      agentRepresent: ["Anyone"]
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
