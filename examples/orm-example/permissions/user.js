module.exports = [
  {
    gqlTypeName: "User",
    readExpressions: {
      id: ["Anyone"],
      name: ["Anyone"],
      photo: ["Anyone"],
      size: ["Anyone"],
      size2: ["Anyone"],
      iCanBeNull: ["Anyone"]
    }
  }
];
