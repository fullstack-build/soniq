module.exports = [
  {
    gqlTypeName: "Photo",
    readExpressions: {
      id: ["Anyone"],
      name: ["Anyone"],
      description: ["Anyone"],
      fileName: ["Anyone"],
      views: ["Anyone"],
      isPublished: ["Anyone"]
    }
  }
];
