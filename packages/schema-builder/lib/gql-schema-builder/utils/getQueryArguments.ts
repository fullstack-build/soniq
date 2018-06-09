function getViewnamesArgument(typesEnumName) {
  return {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'viewnames'
      },
      type: {
        kind: 'ListType',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: typesEnumName
            }
          }
        }
      },
      defaultValue: null,
      directives: []
    };
}

export default (extendArguments) => {
  return (typesEnumName, name) => {
    let args: any = [
      getViewnamesArgument(typesEnumName)
    ];

    if (extendArguments != null) {
      let newArguments = [];
      extendArguments.forEach((extendArgument) => {
        newArguments = newArguments.concat(extendArgument(typesEnumName, name));
      });
      args = args.concat(newArguments);
    }

    return args;
  };
};
