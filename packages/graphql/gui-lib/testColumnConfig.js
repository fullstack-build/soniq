export const columnExtensionPropertySchemas = [{
  "type": "id",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Id Column Properties",
    "additionalProperties": false
  }
}, {
  "type": "text",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "int",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "intArray",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "float",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "boolean",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "manyToOne",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "ManyToOne Column Properties",
    "required": ["foreignTableId"],
    "properties": {
      "foreignTableId": {
        "$id": "#/properties/foreignTableId",
        "type": "string",
        "title": "FOREIGN_TABLE",
        "description": "An foreignTableId another table",
        "pattern": "^(.*)$"
      },
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "onDelete": {
        "$id": "#/properties/onDelete",
        "type": "string",
        "title": "Relation onDelete behaviour",
        "default": "NO ACTION",
        "enum": ["NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT"]
      },
      "onUpdate": {
        "$id": "#/properties/onUpdate",
        "type": "string",
        "title": "Relation onUpdate behaviour",
        "default": "NO ACTION",
        "enum": ["NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT"]
      },
      "validation": {
        "$id": "#/properties/validation",
        "type": "string",
        "title": "Relation validation",
        "enum": ["NOT DEFERRABLE", "INITIALLY DEFERRED", "DEFERRABLE"]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "oneToMany",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "OneToMany Column Properties",
    "required": ["foreignColumnId"],
    "properties": {
      "foreignColumnId": {
        "$id": "#/properties/foreignColumnId",
        "type": "string",
        "title": "FOREIGN_COLUMN_MANY_TO_ONE",
        "description": "An foreignColumnId another table",
        "pattern": "^(.*)$"
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "enum",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "ManyToOne Column Properties",
    "required": ["values"],
    "properties": {
      "values": {
        "$id": "#/properties/values",
        "type": "array",
        "title": "ENUM_VALUES",
        "uniqueItems": true,
        "items": {
          "$id": "#/properties/values/items",
          "type": "string",
          "title": "An enum value",
          "examples": ["FOO", "BAR"],
          "pattern": "^(.*)$"
        }
      },
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "dateTimeUTC",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "createdAt",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "CreatedAt Column Properties",
    "additionalProperties": false
  }
}, {
  "type": "updatedAt",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "UpdatedAt Column Properties",
    "additionalProperties": false
  }
}, {
  "type": "textArray",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "uuid",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "bigint",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "bigintArray",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "json",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "jsonb",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Generic Column Properties",
    "required": [],
    "properties": {
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "computed",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "Computed Column Properties",
    "required": ["appliedExpressionId"],
    "properties": {
      "appliedExpressionId": {
        "$id": "#/properties/appliedExpressionId",
        "type": "string",
        "title": "APPLIED_EXPRESSION",
        "description": "An appliedExpressionId from the local table",
        "default": "",
        "examples": ["caa8b54a-eb5e-4134-8ae2-a3946a428ec7"],
        "pattern": "^(.*)$"
      },
      "moveSelectToQuery": {
        "$id": "#/properties/moveSelectToQuery",
        "type": "boolean",
        "title": "Select the column in QueryBuilder not in view",
        "default": false,
        "examples": [true, false]
      }
    },
    "additionalProperties": false
  }
}, {
  "type": "file",
  "schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "ManyToOne Column Properties",
    "required": [],
    "properties": {
      "types": {
        "$id": "#/properties/types",
        "type": "array",
        "title": "ENUM_VALUES",
        "uniqueItems": true,
        "items": {
          "$id": "#/properties/types/items",
          "type": "string",
          "title": "A file-type",
          "default": "DEFAULT",
          "examples": ["DEFAULT"],
          "pattern": "^(.*)$"
        }
      },
      "nullable": {
        "$id": "#/properties/nullable",
        "type": "boolean",
        "title": "Is column nullable or not",
        "default": true,
        "examples": [true]
      },
      "defaultExpression": {
        "$id": "#/properties/defaultExpression",
        "type": "string",
        "title": "The default value of the column as pg expression",
        "default": null,
        "examples": ["'foobar'::text"],
        "pattern": "^(.*)$"
      }
    },
    "additionalProperties": false
  }
}];