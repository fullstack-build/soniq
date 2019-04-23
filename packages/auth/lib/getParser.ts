function getAuthFactorCreationTokensArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "authFactorCreationTokens"
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "ListType",
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String"
            }
          }
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getLoginProviderSetsArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "loginProviderSets"
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "ListType",
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String"
            }
          }
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getModifyProviderSetsArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "modifyProviderSets"
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "ListType",
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String"
            }
          }
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getIsActiveArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "isActive"
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: "Boolean"
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getPrivacyAgreementAcceptanceTokenArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "privacyAgreementAcceptanceToken"
    },
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: "String"
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getMetaArgument() {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "meta"
    },
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: "String"
      }
    },
    defaultValue: null,
    directives: []
  };
}

export function getParser(setParserMeta, getParserMeta) {
  const parser: any = {};

  parser.parseReadField = (ctx) => {
    const { fieldName, directives, table } = ctx;

    if (table.directives.auth != null) {
      setParserMeta("authTableName", table.tableName);
      setParserMeta("authSchemaName", table.schemaName);
      setParserMeta("authGqlTypeName", table.gqlTypeName);
    }

    if (directives.privacyAgreementAcceptedVersion != null) {
      setParserMeta("privacyAgreementAcceptedVersion", fieldName);
    }
    if (directives.privacyAgreementAcceptedAtInUTC != null) {
      setParserMeta("privacyAgreementAcceptedAtInUTC", fieldName);
    }

    return null;
  };

  parser.modifyMutation = (mutation) => {
    if (mutation.type === "CREATE" && getParserMeta("authGqlTypeName") != null && mutation.gqlTypeName === getParserMeta("authGqlTypeName")) {
      mutation.gqlReturnTypeName = "LoginData";
      mutation.extensions.returnOnlyId = true;
      mutation.extensions.auth = "REGISTER_USER_MUTATION";

      return {
        mutation,
        extendArguments: [
          getAuthFactorCreationTokensArgument(),
          getLoginProviderSetsArgument(),
          getModifyProviderSetsArgument(),
          getIsActiveArgument(),
          getPrivacyAgreementAcceptanceTokenArgument(),
          getMetaArgument()
        ]
      };
    }

    return null;
  };

  return parser;
}
