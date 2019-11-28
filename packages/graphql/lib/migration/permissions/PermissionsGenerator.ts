import { IDbSchema, IDbTable } from "../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION, IModuleEnvConfig } from "@fullstack-one/core";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler } from "../ExpressionCompiler";
import { QueryPermissionGenerator } from "./QueryPermissionGenerator";
import { MutationPermissionGenerator } from "./MutationPermissionGenerator";
import { IDefaultResolverMeta, IPgView } from "../../RuntimeInterfaces";
import { IGqlCommand } from "../interfaces";
import { getPgSelector } from "../helpers";

// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");

function sha1(input) {
  return crypto
    .createHash("sha1")
    .update(input)
    .digest("hex");
}

export const LOCAL_TABLE_ALIAS = "_local_table_";

export class PermissionGenerator {
  private queryPermissionGenerator: QueryPermissionGenerator;
  private mutationPermissionGenerator: MutationPermissionGenerator;

  constructor() {
    this.queryPermissionGenerator = new QueryPermissionGenerator();
    this.mutationPermissionGenerator = new MutationPermissionGenerator();
  }
  private getViewsByName(views: IPgView[]): IViewsByName {
    const viewsByName: IViewsByName = {};

    views.forEach((view) => {
      if (viewsByName[view.name] != null) {
        throw new Error(`Duplicate generated view '${view.name}'.`);
      }

      viewsByName[view.name] = view;
    });

    return viewsByName;
  }
  private getExistingViewsByName(existingViews: IExistingView[]): IExistingViewsByName {
    const existingViewsByName = {};

    existingViews.forEach((existingView) => {
      existingViewsByName[existingView.name] = existingView;
    });

    return existingViewsByName;
  }
  private async getExistingViews(dbClient: PoolClient, schema: string): Promise<IExistingView[]> {
    const query = `
      SELECT 
        table_schema "schema", 
        table_name "name", 
        obj_description(('"' || table_schema || '"."' || table_name || '"')::regclass) "comment"
      FROM information_schema.views 
      WHERE table_schema = $1;
    `;

    const { rows } = await dbClient.query(query, [schema]);

    return rows.map((row) => {
      const splittedComment = row.comment.split("_");
      let hash = null;
      if (splittedComment[0] === "ONE" && splittedComment[1] != null) {
        hash = splittedComment[1];
      }

      return {
        ...row,
        hash
      };
    });
  }
  public async generate(schema: IDbSchema, dbClient: PoolClient, helpers: IHelpers, envConfig: IModuleEnvConfig) {
    let gqlTypeDefs = "";
    const commands: IGqlCommand[] = [];
    const views = [];
    const resolvers = [];
    const defaultResolverMeta: IDefaultResolverMeta = {
      viewsSchemaName: schema.permissionViewSchema,
      query: {},
      mutation: {},
      costLimit: envConfig.costLimit != null ? envConfig.costLimit : 2000000000,
      minSubqueryCountToCheckCostLimit: envConfig.minSubqueryCountToCheckCostLimit != null ? envConfig.minSubqueryCountToCheckCostLimit : 3,
      playgroundActive: envConfig.playgroundActive === true,
      introspectionActive: envConfig.introspectionActive === true
    };

    schema.tables.forEach((table) => {
      const expressionCompiler = new ExpressionCompiler(schema, table, helpers, LOCAL_TABLE_ALIAS, false);

      // Generate READ Permissions
      const queryPermissions = this.queryPermissionGenerator.generate(schema, table, helpers, expressionCompiler);

      queryPermissions.views.forEach((view) => {
        views.push(view);
      });
      queryPermissions.resolvers.forEach((resolver) => {
        resolvers.push(resolver);
      });
      gqlTypeDefs += `${queryPermissions.gqlTypeDefs}\n`;

      if (defaultResolverMeta.query[queryPermissions.queryViewMeta.name] != null) {
        throw new Error(`Duplicate query name: '${queryPermissions.queryViewMeta.name}'.`);
      }

      defaultResolverMeta.query[queryPermissions.queryViewMeta.name] = queryPermissions.queryViewMeta;

      // Generate READ Permissions
      const mutationExpressionCompiler = new ExpressionCompiler(schema, table, helpers, LOCAL_TABLE_ALIAS, true);
      const mutationsMeta = this.mutationPermissionGenerator.generate(schema, table, helpers, mutationExpressionCompiler);

      mutationsMeta.views.forEach((view) => {
        views.push(view);
      });
      mutationsMeta.resolvers.forEach((resolver) => {
        resolvers.push(resolver);
      });
      gqlTypeDefs += `${mutationsMeta.gqlTypeDefs}\n`;

      mutationsMeta.mutationViewMetas.forEach((mutationViewMeta) => {
        if (defaultResolverMeta.mutation[mutationViewMeta.name] != null) {
          throw new Error(`Duplicate mutation name: '${mutationViewMeta.name}'.`);
        }
        defaultResolverMeta.mutation[mutationViewMeta.name] = mutationViewMeta;
      });
    });

    const existingViews = await this.getExistingViews(dbClient, schema.permissionViewSchema);
    const existingViewsByName = this.getExistingViewsByName(existingViews);
    const viewsByName = this.getViewsByName(views);

    // Find Views to delete
    existingViews.forEach((existingView) => {
      if (viewsByName[existingView.name] == null) {
        // Delete it
        commands.push({
          sqls: [`DROP VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(existingView.name)};`],
          operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 101
        });
      }
    });

    // Find Views to add and change
    views.forEach((view) => {
      if (existingViewsByName[view.name] != null) {
        // Update it
        if (existingViewsByName[view.name].hash == null || existingViewsByName[view.name].hash !== sha1(view.sql)) {
          commands.push({
            sqls: [`DROP VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(view.name)};`],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 101
          });
          commands.push({
            sqls: [
              view.sql,
              `COMMENT ON VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(view.name)} IS 'ONE_${sha1(view.sql)}_Your comment';`
            ],
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100
          });
        }
      } else {
        commands.push({
          sqls: [
            view.sql,
            `COMMENT ON VIEW ${getPgSelector(schema.permissionViewSchema)}.${getPgSelector(view.name)} IS 'ONE_${sha1(view.sql)}_Your comment';`
          ],
          operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100
        });
      }
    });

    const result = {
      defaultResolverMeta,
      gqlTypeDefs,
      resolvers,
      commands
    };

    return result;
  }
}

export interface IExistingView {
  name: string;
  schema: string;
  comment: string;
  hash: string;
}

export interface IExistingViewsByName {
  [name: string]: IExistingView;
}

export interface IViewsByName {
  [name: string]: IPgView;
}
