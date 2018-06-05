function getViewnamesArgument(viewsEnumName) {
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
              value: viewsEnumName
            }
          }
        }
      },
      defaultValue: null,
      directives: []
    };
}

function getInputArgument(inputType) {
  return {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'input'
      },
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: inputType
          }
      }},
      defaultValue: null,
      directives: []
    };
}

export default (viewsEnumName, inputType, extendArguments) => {

  let args: any = [
    getInputArgument(inputType)
  ];

  if (viewsEnumName != null) {
    args.push(getViewnamesArgument(viewsEnumName));
  }

  if (extendArguments != null) {
    args = args.concat(extendArguments);
  }

  return args;
};
