import { DbSchemaBuilder } from "./db-schema-builder";
export { IDbMeta, IDbRelation };
import * as utils from "./gql-schema-builder/utils";
export { utils };
import { IDbMeta, IDbRelation } from "./db-schema-builder/IDbMeta";
export { splitActionFromNode } from "./db-schema-builder/helper";
export { createConstraint } from "./db-schema-builder/fromGQl/gQlAstToDbMetaHelper";
export { registerDirectiveParser } from "./db-schema-builder/fromGQl/gQlAstToDbMeta";
export { registerQueryParser } from "./db-schema-builder/fromPg/pgToDbMeta";
export { registerTriggerParser } from "./db-schema-builder/fromPg/pgToDbMeta";
export { registerColumnMigrationExtension, registerTableMigrationExtension } from "./db-schema-builder/toPg/createSqlObjFromMigrationObject";
export declare class SchemaBuilder {
  private schemaBuilderConfig;
  private gQlSdl;
  private gqlSdlExtensions;
  private gQlAst;
  private permissions;
  private expressions;
  private gqlRuntimeDocument;
  private resolverMeta;
  private dbSchemaBuilder;
  private pgToDbMeta;
  private dbMeta;
  private extensions;
  private config;
  private loggerFactory;
  private logger;
  private ENVIRONMENT;
  constructor(config: any, loggerFactory: any, bootLoader: any, dbSchemaBuilder: any, pgToDbMeta: any);
  private boot;
  getDbSchemaBuilder(): DbSchemaBuilder;
  getPgDbMeta(): Promise<IDbMeta>;
  addExtension(extension: any): void;
  getDbMeta(): any;
  extendSchema(schema: string): void;
  getGQlRuntimeObject(): {
    dbMeta: any;
    gqlRuntimeDocument: any;
    resolverMeta: any;
  };
  getGQlSdl(): any;
  getGQlAst(): any;
  print(document: any): any;
}
