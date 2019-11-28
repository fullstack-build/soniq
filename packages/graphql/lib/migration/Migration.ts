import { PoolClient, IModuleMigrationResult, asyncForEach, IAppConfig, IModuleEnvConfig, IModuleAppConfig } from "@fullstack-one/core";
import { IDbSchema } from "./DbSchemaInterface";
import { DbSchemaValidator } from "./DbSchemaValidator";
import * as _ from "lodash";
import * as uuidValidate from "uuid-validate";
import { IColumnExtension } from "./columnExtensions/IColumnExtension";
import { createMergeResultFunction } from "./helpers";
import { ISchemaExtension, IHelpers } from "./schemaExtensions/ISchemaExtension";
import { ITableExtension } from "./tableExtensions/ITableExtension";
import { PermissionGenerator } from "./permissions/PermissionsGenerator";
import { print, parse } from "graphql";

// Default migration extensions
import { schemaExtensionSchemas } from "./schemaExtensions/schemas";
import { schemaExtensionTables } from "./schemaExtensions/tables";
import { tableExtenstionColumns } from "./tableExtensions/columns";
import { tableExtenstionChecks } from "./tableExtensions/checks";
import { tableExtenstionIndexes } from "./tableExtensions/indexes";
import { columnExtensionId } from "./columnExtensions/id";
import {
  columnExtensionText,
  columnExtensionInt,
  columnExtensionFloat,
  columnExtensionBoolean,
  columnExtensionDateTimeUTC,
  columnExtensionTextArray,
  columnExtensionUuid,
  columnExtensionIntArray,
  columnExtensionBigIntArray,
  columnExtensionBigInt
} from "./columnExtensions/generic";
import { columnExtensionManyToOne } from "./columnExtensions/relation/manyToOne";
import { columnExtensionOneToMany } from "./columnExtensions/relation/oneToMany";
import { columnExtensionEnum } from "./columnExtensions/enum";
import { columnExtensionCreatedAt } from "./columnExtensions/createdAt";
import { columnExtensionUpdatedAt } from "./columnExtensions/updatedAt";
import { schemaExtensionFunctions } from "./schemaExtensions/functions";
import { IResolver } from "../RuntimeInterfaces";

export type ITypeDefsExtension = () => string;
export type IResolverExtension = () => IResolver;

export class Migration {
  private columnExtensions: {
    [type: string]: IColumnExtension;
  } = {};
  private schemaExtensions: ISchemaExtension[] = [];
  private tableExtensions: ITableExtension[] = [];
  private typeDefsExtensions: ITypeDefsExtension[] = [];
  private resolverExtensions: IResolverExtension[] = [];

  constructor() {
    // Add default migration extensions
    this.addSchemaExtension(schemaExtensionSchemas);
    this.addSchemaExtension(schemaExtensionTables);
    this.addSchemaExtension(schemaExtensionFunctions);

    this.addTableExtension(tableExtenstionColumns);
    this.addTableExtension(tableExtenstionChecks);
    this.addTableExtension(tableExtenstionIndexes);

    this.addColumnExtension(columnExtensionId);
    this.addColumnExtension(columnExtensionText);
    this.addColumnExtension(columnExtensionInt);
    this.addColumnExtension(columnExtensionIntArray);
    this.addColumnExtension(columnExtensionFloat);
    this.addColumnExtension(columnExtensionBoolean);
    this.addColumnExtension(columnExtensionManyToOne);
    this.addColumnExtension(columnExtensionOneToMany);
    this.addColumnExtension(columnExtensionEnum);
    this.addColumnExtension(columnExtensionDateTimeUTC);
    this.addColumnExtension(columnExtensionCreatedAt);
    this.addColumnExtension(columnExtensionUpdatedAt);
    this.addColumnExtension(columnExtensionTextArray);
    this.addColumnExtension(columnExtensionUuid);
    this.addColumnExtension(columnExtensionBigInt);
    this.addColumnExtension(columnExtensionBigIntArray);
  }

  public addSchemaExtension(schemaExtension: ISchemaExtension) {
    this.schemaExtensions.push(schemaExtension);
  }

  public addTableExtension(tableExtension: ITableExtension) {
    this.tableExtensions.push(tableExtension);
  }

  public addColumnExtension(columnExtension: IColumnExtension) {
    if (this.columnExtensions[columnExtension.type] != null) {
      throw new Error(`Type "${columnExtension.type}" is already defined.`);
    }
    this.columnExtensions[columnExtension.type] = columnExtension;
  }

  public addTypeDefsExtension(typeDefsExtension: ITypeDefsExtension) {
    this.typeDefsExtensions.push(typeDefsExtension);
  }

  public addResolverExtension(resolverExtension: IResolverExtension) {
    this.resolverExtensions.push(resolverExtension);
  }

  public async generateSchemaMigrationCommands(
    appConfig: IModuleAppConfig,
    envConfig: IModuleEnvConfig,
    dbClient: PoolClient
  ): Promise<IModuleMigrationResult> {
    const schema = appConfig as IDbSchema;

    const result: IModuleMigrationResult = {
      moduleRuntimeConfig: {},
      commands: [],
      errors: [],
      warnings: []
    };
    const mergeResult = createMergeResultFunction(result);

    // 1) Validate DbSchema
    const dbSchemaValidator = new DbSchemaValidator();

    const validationErrors = dbSchemaValidator.validate(schema);
    if (validationErrors.length > 0) {
      return {
        moduleRuntimeConfig: {},
        errors: validationErrors,
        warnings: [],
        commands: []
      };
    }

    const allIds: string[] = [];

    const helpers: IHelpers = {
      getColumnExtensionByType: (type: string) => {
        return type != null && this.columnExtensions[type] != null ? this.columnExtensions[type] : null;
      },
      getTableExtensions: () => {
        return this.tableExtensions;
      },
      validateId: (id: string) => {
        if (id == null) {
          return "ID is null.";
        }
        if (uuidValidate(id) !== true) {
          return "ID is not a valid uuid.";
        }
        if (allIds.indexOf(id) >= 0) {
          return "ID is already used for another entity.";
        }
        allIds.push(id);

        return null;
      }
    };

    // Generate Table-Migrations
    await asyncForEach(this.schemaExtensions, async (schemaExtension: ISchemaExtension) => {
      const extensionResult = await schemaExtension.generateCommands(schema, dbClient, helpers);
      mergeResult(extensionResult);
    });

    // Generate Gql-Schema, Permission-Views and Metadata
    if (schema.permissionViewSchema != null) {
      const permissionGenerator = new PermissionGenerator();
      const permissions = await permissionGenerator.generate(schema, dbClient, helpers, envConfig);
      permissions.commands.forEach((command) => {
        result.commands.push(command);
      });

      let gqlTypeDefs = `scalar JSON\n${permissions.gqlTypeDefs}`;

      // Add Typedefextensions
      this.typeDefsExtensions.forEach((typeDefs) => {
        gqlTypeDefs += `${typeDefs()}\n`;
      });

      // Replace the first Query/Mutation extensions with definitions
      gqlTypeDefs = gqlTypeDefs.replace("\nextend type Query {\n", "\ntype Query {\n");
      gqlTypeDefs = gqlTypeDefs.replace("\nextend type Mutation {\n", "\ntype Mutation {\n");

      const gqlSchema = parse(gqlTypeDefs);

      const resolvers = [];

      permissions.resolvers.forEach((resolver) => {
        resolvers.push(resolver);
      });

      this.resolverExtensions.forEach((resolver) => {
        resolvers.push(resolver());
      });

      result.moduleRuntimeConfig = {
        gqlTypeDefs: print(gqlSchema),
        defaultResolverMeta: permissions.defaultResolverMeta,
        resolvers
      };
    }

    return result;
  }
}
