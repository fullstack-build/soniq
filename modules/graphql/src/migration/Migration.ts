import { PoolClient, IModuleMigrationResult, IMigrationError, ICommand, IAutoAppConfigFix } from "soniq";
import { DbSchemaValidator } from "./DbSchemaValidator";
import * as uuidValidate from "uuid-validate";
import { IColumnExtension } from "./columnExtensions/IColumnExtension";
import { createMergeResultFunction } from "./helpers";
import { ISchemaExtension, IHelpers } from "./schemaExtensions/ISchemaExtension";
import { ITableExtension } from "./tableExtensions/ITableExtension";
import { IPostProcessingExtension } from "./postProcessingExtensions/IPostProcessingExtension";
import { PermissionGenerator, IPermissionGeneratorResult } from "./permissions/PermissionsGenerator";
import { print, parse, DocumentNode } from "graphql";

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
  columnExtensionBigInt,
  columnExtensionJson,
  columnExtensionJsonb,
} from "./columnExtensions/generic";
import { columnExtensionManyToOne } from "./columnExtensions/relation/manyToOne";
import { columnExtensionOneToMany } from "./columnExtensions/relation/oneToMany";
import { columnExtensionEnum } from "./columnExtensions/enum";
import { columnExtensionCreatedAt } from "./columnExtensions/createdAt";
import { columnExtensionUpdatedAt } from "./columnExtensions/updatedAt";
import { schemaExtensionFunctions } from "./schemaExtensions/functions";
import { IResolver, IGraphqlRuntimeConfig } from "../RuntimeInterfaces";
import { columnExtensionComputed } from "./columnExtensions/computed";
import { IGqlCommand, IGqlMigrationContext, IGqlMigrationResult, IAutoSchemaFix, IPropertySchema } from "./interfaces";
import { IGraphqlAppConfig, IGraphqlOptionsInput } from "../moduleDefinition/interfaces";
import { IDbSchema, IDbTable, IDbColumn, IDbIndex, IDbCheck } from "./DbSchemaInterface";

export type ITypeDefsExtension = () => string;
export type IResolverExtension = () => IResolver;

export class Migration {
  private _columnExtensions: {
    [type: string]: IColumnExtension;
  } = {};
  private _schemaExtensions: ISchemaExtension[] = [];
  private _tableExtensions: ITableExtension[] = [];
  private _postProcessingExtensions: IPostProcessingExtension[] = [];
  private _typeDefsExtensions: ITypeDefsExtension[] = [];
  private _resolverExtensions: IResolverExtension[] = [];

  public constructor() {
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
    this.addColumnExtension(columnExtensionJson);
    this.addColumnExtension(columnExtensionJsonb);
    this.addColumnExtension(columnExtensionComputed);
  }

  public addSchemaExtension(schemaExtension: ISchemaExtension): void {
    this._schemaExtensions.push(schemaExtension);
  }

  public addTableExtension(tableExtension: ITableExtension): void {
    this._tableExtensions.push(tableExtension);
  }

  public addColumnExtension(columnExtension: IColumnExtension): void {
    if (this._columnExtensions[columnExtension.type] != null) {
      throw new Error(`Type "${columnExtension.type}" is already defined.`);
    }
    this._columnExtensions[columnExtension.type] = columnExtension;
  }

  public addPostProcessingExtension(postProcessingExtension: IPostProcessingExtension): void {
    this._postProcessingExtensions.push(postProcessingExtension);
  }

  public addTypeDefsExtension(typeDefsExtension: ITypeDefsExtension): void {
    this._typeDefsExtensions.push(typeDefsExtension);
  }

  public addResolverExtension(resolverExtension: IResolverExtension): void {
    this._resolverExtensions.push(resolverExtension);
  }

  public async generateSchemaMigrationCommands(
    appConfig: IGraphqlAppConfig,
    pgClient: PoolClient
  ): Promise<IModuleMigrationResult> {
    const gqlMigrationContext: IGqlMigrationContext = {};
    const options: IGraphqlOptionsInput = appConfig.options;
    const schema: IDbSchema = appConfig.schema;

    let gqlResult: IGqlMigrationResult = {
      commands: [],
      errors: [],
      warnings: [],
    };
    const mergeResult: (newResult: IGqlMigrationResult) => void = createMergeResultFunction(gqlResult);

    // 1) Validate DbSchema
    const dbSchemaValidator: DbSchemaValidator = new DbSchemaValidator();

    const validationErrors: IMigrationError[] = dbSchemaValidator.validate(schema);
    if (validationErrors.length > 0) {
      return {
        moduleRuntimeConfig: {},
        errors: validationErrors,
        warnings: [],
        commands: [],
      };
    }

    const allIds: string[] = [];

    const helpers: IHelpers = {
      getColumnExtensionByType: (type: string) => {
        return type != null && this._columnExtensions[type] != null ? this._columnExtensions[type] : null;
      },
      getTableExtensions: () => {
        return this._tableExtensions;
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
      },
    };

    // Generate Table-Migrations
    for (const schemaExtension of this._schemaExtensions) {
      const extensionResult: IGqlMigrationResult = await schemaExtension.generateCommands(
        appConfig,
        pgClient,
        helpers,
        gqlMigrationContext
      );
      mergeResult(extensionResult);
    }
    if (gqlResult.errors.length > 0) {
      return {
        ...gqlResult,
        moduleRuntimeConfig: {},
      };
    }

    // Migration post-processing
    for (const postProcessingExtension of this._postProcessingExtensions) {
      gqlResult = await postProcessingExtension.generateCommands(
        appConfig,
        pgClient,
        helpers,
        gqlMigrationContext,
        gqlResult
      );
    }
    if (gqlResult.errors.length > 0) {
      return {
        ...gqlResult,
        moduleRuntimeConfig: {},
      };
    }

    const gqlSchemaResult: IGqlMigrationResult = gqlResult;
    let moduleRuntimeConfig: IGraphqlRuntimeConfig | {} = {};

    // Generate Gql-Schema, Permission-Views and Metadata
    if (schema.permissionViewSchema != null) {
      const permissionGenerator: PermissionGenerator = new PermissionGenerator();
      const permissions: IPermissionGeneratorResult = await permissionGenerator.generate(schema, pgClient, helpers);
      permissions.commands.forEach((command: IGqlCommand) => {
        gqlSchemaResult.commands.push(command);
      });

      let gqlTypeDefs: string = `scalar JSON\n${permissions.gqlTypeDefs}`;

      // Add Typedefextensions
      this._typeDefsExtensions.forEach((typeDefs: ITypeDefsExtension) => {
        gqlTypeDefs += `${typeDefs()}\n`;
      });

      // Replace the first Query/Mutation extensions with definitions
      gqlTypeDefs = gqlTypeDefs.replace("\nextend type Query {\n", "\ntype Query {\n");
      gqlTypeDefs = gqlTypeDefs.replace("\nextend type Mutation {\n", "\ntype Mutation {\n");

      const gqlSchema: DocumentNode = parse(gqlTypeDefs);

      const resolvers: unknown[] = [];

      permissions.resolvers.forEach((resolver: IResolver) => {
        resolvers.push(resolver);
      });

      this._resolverExtensions.forEach((resolver: IResolverExtension) => {
        resolvers.push(resolver());
      });

      moduleRuntimeConfig = {
        gqlTypeDefs: print(gqlSchema),
        defaultResolverMeta: permissions.defaultResolverMeta,
        resolvers: resolvers as IResolver[],
        options: {
          costLimit: options.costLimit != null ? options.costLimit : 2000000000,
          minSubqueryCountToCheckCostLimit:
            options.minSubqueryCountToCheckCostLimit != null ? options.minSubqueryCountToCheckCostLimit : 3,
          introspectionActive: options.introspectionActive === true,
          endpointPath: options.endpointPath || "/graphql",
          dangerouslyExposeErrorDetails: options.dangerouslyExposeErrorDetails === true,
        },
      };
    }

    const commands: ICommand[] = gqlSchemaResult.commands.map(
      (command: IGqlCommand): ICommand => {
        if (command.autoSchemaFixes != null) {
          command.autoAppConfigFixes = command.autoSchemaFixes.map(
            (autoSchemaFix: IAutoSchemaFix): IAutoAppConfigFix => {
              const autoAppConfigFix: IAutoAppConfigFix = {
                moduleKey: "GraphQl",
                path: "schema",
                value: autoSchemaFix.value,
                message: autoSchemaFix.message,
              };

              if (autoSchemaFix.tableId != null && schema.tables != null) {
                const tableIndex: number = schema.tables.findIndex((table: IDbTable) => {
                  return table.id === autoSchemaFix.tableId;
                });
                autoAppConfigFix.objectId = autoSchemaFix.tableId;
                autoAppConfigFix.path += `.tables.${tableIndex}`;

                if (autoSchemaFix.columnId != null) {
                  const columnIndex: number = schema.tables[tableIndex].columns.findIndex((column: IDbColumn) => {
                    return column.id === autoSchemaFix.columnId;
                  });

                  autoAppConfigFix.objectId = autoSchemaFix.columnId;
                  autoAppConfigFix.path += `.columns.${columnIndex}`;
                } else if (autoSchemaFix.indexId != null && schema.tables[tableIndex].indexes != null) {
                  const indexIndex: number | undefined = schema.tables[tableIndex].indexes?.findIndex(
                    (index: IDbIndex) => {
                      return index.id === autoSchemaFix.indexId;
                    }
                  );

                  if (indexIndex == null) {
                    throw new Error(
                      `Could not find indexId. This AutoSchemaFix is invalid: ${JSON.stringify(autoSchemaFix, null, 2)}`
                    );
                  }

                  autoAppConfigFix.objectId = autoSchemaFix.indexId;
                  autoAppConfigFix.path += `.indexes.${indexIndex}`;
                } else if (autoSchemaFix.checkId != null && schema.tables[tableIndex].checks != null) {
                  const checkIndex: number | undefined = schema.tables[tableIndex].checks?.findIndex(
                    (check: IDbCheck) => {
                      return check.id === autoSchemaFix.checkId;
                    }
                  );

                  if (checkIndex == null) {
                    throw new Error(
                      `Could not find checkId. This AutoSchemaFix is invalid: ${JSON.stringify(autoSchemaFix, null, 2)}`
                    );
                  }

                  autoAppConfigFix.objectId = autoSchemaFix.checkId;
                  autoAppConfigFix.path += `.checks.${checkIndex}`;
                } else {
                  throw new Error(`This AutoSchemaFix is invalid: ${JSON.stringify(autoSchemaFix, null, 2)}`);
                }
              }

              autoAppConfigFix.path += autoSchemaFix.key === "" ? "" : `.${autoSchemaFix.key}`;

              return autoAppConfigFix;
            }
          );
        }

        return command;
      }
    );

    // Generate other stuff like triggers etc.

    return {
      commands,
      errors: gqlSchemaResult.errors,
      warnings: gqlSchemaResult.warnings,
      moduleRuntimeConfig,
    };
  }

  public getColumnExtensionPropertySchemas(): IPropertySchema[] {
    return Object.keys(this._columnExtensions).map((type: string) => {
      return {
        type,
        schema: this._columnExtensions[type].getPropertiesDefinition(),
      };
    });
  }
}
