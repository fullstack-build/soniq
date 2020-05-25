import { IDbSchema, IDbTable, IDbColumn } from "./DbSchemaInterface";
import { IMigrationError } from "soniq";
import * as uuidValidate from "uuid-validate";

export class DbSchemaValidator {
  private _validateSchema(schemaName: string): (IMigrationError | string)[] {
    const errors: (IMigrationError | string)[] = [];
    const forbiddenSchemas: string[] = ["pg_catalog", "information_schema"];

    if (typeof schemaName !== "string") {
      errors.push(`DbSchema.schemas: Must be an array of strings.`);
      return errors;
    }
    if (forbiddenSchemas.indexOf(schemaName) >= 0) {
      errors.push({
        message: `DbSchema.schemas: Must not contain any system-schema: ${JSON.stringify(forbiddenSchemas)}.`,
        meta: {
          schemaName,
        },
      });
    }
    /* Removed this, to use the migration internally
    if (schemaName.startsWith("_")) {
      errors.push({
        message: `DbSchema.schemas: No schema should start with '_'. You defined '${schemaName}'.`,
        schema: schemaName
      });
    } */

    return errors;
  }

  private _validateColumn(column: IDbColumn): (IMigrationError | string)[] {
    const errors: (IMigrationError | string)[] = [];

    if (column == null || typeof column !== "object") {
      errors.push(`DbSchema.column: Must be an object.`);
      return errors;
    }
    if (column.id == null || typeof column.id !== "string") {
      errors.push(`DbSchema.column: Each column must have the property 'id: string'.`);
      return errors;
    }
    if (uuidValidate(column.id) !== true) {
      errors.push({
        message: `DbSchema.column: Invalid uuid. See columnId '${column.id}'.`,
        meta: {
          columnId: column.id,
        },
      });
    }
    if (column.name == null || typeof column.name !== "string") {
      errors.push({
        message: `DbSchema.column: Each column must have the property 'name: string'. See columnId '${column.id}'.`,
        meta: {
          columnId: column.id,
        },
      });
    }
    if (column.type == null || typeof column.type !== "string") {
      errors.push({
        message: `DbSchema.column: Each column must have the property 'type: string'. See columnId '${column.id}'.`,
        meta: {
          columnId: column.id,
        },
      });
    }

    return errors;
  }

  private _validateTable(table: IDbTable): (IMigrationError | string)[] {
    const errors: (IMigrationError | string)[] = [];

    if (table == null || typeof table !== "object") {
      errors.push(`DbSchema.table: Must be an object.`);
      return errors;
    }
    if (table.id == null || typeof table.id !== "string") {
      errors.push(`DbSchema.table: Each table must have the property 'id: string'.`);
      return errors;
    }
    if (uuidValidate(table.id) !== true) {
      errors.push({
        message: `DbSchema.table: Invalid uuid. See tableId '${table.id}'.`,
        meta: {
          tableId: table.id,
        },
      });
    }
    if (table.name == null || typeof table.name !== "string") {
      errors.push({
        message: `DbSchema.table: Each table must have the property 'name: string'. See tableId '${table.id}'.`,
        meta: {
          tableId: table.id,
        },
      });
    }
    if (table.schema == null || typeof table.schema !== "string") {
      errors.push({
        message: `DbSchema.table: Each table must have the property 'schema: string'. See tableId '${table.id}'.`,
        meta: {
          tableId: table.id,
        },
      });
    }
    if (table.columns == null || !Array.isArray(table.columns)) {
      errors.push({
        message: `DbSchema.table: Each table must have the property 'id: string'. See tableId '${table.id}'.`,
        meta: {
          tableId: table.id,
        },
      });
    } else {
      const columnIds: string[] = [];
      const columnNames: string[] = [];

      table.columns.forEach((column: IDbColumn) => {
        const validationErrors: (IMigrationError | string)[] = this._validateColumn(column);

        if (validationErrors.length < 1) {
          // Check for duplicate ids
          if (columnIds.indexOf(column.id) < 0) {
            columnIds.push(column.id);
          } else {
            errors.push({
              message: `DbSchema.column: Duplicate id '${column.id}' on table '${table.schema}.${table.name}'.`,
              meta: {
                tableId: table.id,
                columnId: column.id,
              },
            });
          }
          // Check for duplicate names
          if (columnNames.indexOf(column.name) < 0) {
            columnNames.push(column.name);
          } else {
            errors.push({
              message: `DbSchema.column: Duplicate name '${column.name}' on table '${table.schema}.${table.name}'.`,
              meta: {
                tableId: table.id,
                columnId: column.id,
              },
            });
          }
        }

        validationErrors.forEach((error: unknown) => {
          if (typeof error !== "object") {
            errors.push({
              message: error as string,
              meta: {
                tableId: table.id,
              },
            });
          } else {
            const migrationError: IMigrationError = error as IMigrationError;
            const meta: unknown =
              migrationError.meta != null
                ? {
                    ...migrationError.meta,
                    tableId: table.id,
                  }
                : {
                    tableId: table.id,
                  };
            errors.push({
              ...migrationError,
              meta,
            });
          }
        });
      });
    }

    return errors;
  }

  private _validateDbSchema(dbSchema: IDbSchema): IMigrationError[] {
    const errors: (IMigrationError | string)[] = [];
    // Check Schemas
    if (dbSchema.schemas == null || !Array.isArray(dbSchema.schemas)) {
      errors.push(`DbSchema.schemas: Must be an array of strings.`);
    } else {
      dbSchema.schemas.forEach((schemaName: string) => {
        this._validateSchema(schemaName).forEach((error: IMigrationError | string) => {
          errors.push(error);
        });
      });
    }

    // Check Tables
    if (dbSchema.tables == null || !Array.isArray(dbSchema.tables)) {
      errors.push(`DbSchema.tables: Must be an array.`);
    } else {
      const tableIds: string[] = [];
      const tableNames: string[] = [];

      dbSchema.tables.forEach((table: IDbTable) => {
        const validationErrors: (IMigrationError | string)[] = this._validateTable(table);

        // If Schema is correct, do further checks
        if (validationErrors.length < 1) {
          // Check for duplicate ids
          if (tableIds.indexOf(table.id) < 0) {
            tableIds.push(table.id);
          } else {
            errors.push({
              message: `DbSchema.tables: Duplicate id '${table.id}'.`,
              meta: {
                tableId: table.id,
              },
            });
          }

          // Check for duplicate tableName combinations
          // Changed that from regclass (schema+name) because we should not expose schema-name and thus it makes no sense to have duplicate GQL or TS Typenames
          if (tableNames.indexOf(table.name) < 0) {
            tableNames.push(table.name);
          } else {
            errors.push({
              message: `DbSchema.tables: Duplicate table name: '${table.name}'.`,
              meta: {
                tableId: table.id,
              },
            });
          }

          // Check if the schema exists
          if (dbSchema.schemas.indexOf(table.schema) < 0) {
            errors.push({
              message: `DbSchema.tables: Schema '${table.schema}' is not managed by One. Please add it to dbSchema.schemas. See tableId '${table.id}'.`,
              meta: {
                tableId: table.id,
              },
            });
          }
        }

        validationErrors.forEach((error: IMigrationError | string) => {
          errors.push(error);
        });
      });
    }

    return errors.map((error: IMigrationError | string) => {
      if (typeof error !== "object") {
        return {
          message: error,
        };
      } else {
        return error;
      }
    });
  }

  public validate(dbSchema: IDbSchema): IMigrationError[] {
    return this._validateDbSchema(dbSchema);
  }
}
