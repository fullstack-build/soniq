import * as _ from "lodash";
import { utils } from "@fullstack-one/schema-builder";

const { createArrayField, getEnum } = utils;

const typesEnumName = "FILE_TYPES";
const resolverName = "@fullstack-one/file-storage/readFiles";

export function getParser() {
  const parser: any = {};
  const typesObject: any = {
    DEFAULT: true
  };

  parser.parseUpdateField = (ctx) => {
    const { view, fieldName, directives } = ctx;

    if (view.fields.indexOf(fieldName) >= 0 && directives.files != null) {
      const gqlArrayFieldDefinition: any = createArrayField(fieldName, "String");
      const types = directives.files.types || ["DEFAULT"];

      gqlArrayFieldDefinition.description = {
        kind: "StringValue",
        value: `List of FileNames. Allowed types: [${types.map((type) => `"${type}"`).join(", ")}]`,
        block: true
      };
      return [gqlArrayFieldDefinition];
    }
    return null;
  };

  parser.parseCreateField = (ctx) => {
    return parser.parseUpdateField(ctx);
  };

  parser.parseReadField = (ctx) => {
    const { fieldName, readExpressions, directives } = ctx;

    // Has field any permission-expression
    if (readExpressions[fieldName] != null && directives.files != null) {
      const { defaultFieldCreator, localTable } = ctx;

      const params = directives.files.params || {};
      const types = directives.files.types || ["DEFAULT"];

      const regex = "^[_a-zA-Z][_a-zA-Z0-9]{3,30}$";
      const regexp = new RegExp(regex);

      types.forEach((type) => {
        if (regexp.test(type) !== true) {
          throw new Error(`The type '${type}' has to match RegExp '${regex}'. Have a look at ${ctx.table.gqlTypeName}.${ctx.fieldName}`);
        }

        typesObject[type] = true;
      });

      const columnExpression = `"${localTable}"."${fieldName}"`;

      const { publicFieldSql, authFieldSql, gqlFieldDefinition } = defaultFieldCreator.create(
        readExpressions[fieldName],
        JSON.parse(JSON.stringify(ctx.gqlFieldDefinition)),
        columnExpression,
        fieldName
      );

      gqlFieldDefinition.description = {
        kind: "StringValue",
        value: `List of Files. Allowed types: [${types.map((type) => `"${type}"`).join(", ")}]`,
        block: true
      };

      gqlFieldDefinition.directives.push({
        kind: "Directive",
        name: {
          kind: "Name",
          value: "custom"
        },
        arguments: [
          {
            kind: "Argument",
            name: {
              kind: "Name",
              value: "resolver"
            },
            value: {
              kind: "StringValue",
              value: resolverName,
              block: false
            }
          }
        ]
      });

      return [
        {
          gqlFieldName: fieldName,
          nativeFieldName: fieldName,
          publicFieldSql,
          authFieldSql,
          gqlFieldDefinition,
          isVirtual: true
        }
      ];
    }
    return null;
  };

  parser.extendDefinitions = (ctx) => {
    const types = Object.keys(typesObject);
    return [getEnum(typesEnumName, types)];
  };

  return parser;
}
