import { IDbSchema } from "../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { ExpressionCompiler } from "../ExpressionCompiler";
import { QueryPermissionGenerator } from "./QueryPermissionGenerator";
import { MutationPermissionGenerator } from "./MutationPermissionGenerator";
import {
  IDefaultResolverMeta,
  IPgView,
  IQueryPermissionGeneratorResult,
  IMutationsMeta,
  IResolverMapping,
} from "../../moduleDefinition/RuntimeInterfaces";
import { IGqlCommand } from "../interfaces";
import { getPgSelector } from "../helpers";

import * as crypto from "crypto";

function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

export const LOCAL_TABLE_ALIAS: string = "_local_table_";

export class PermissionGenerator {
  private _queryPermissionGenerator: QueryPermissionGenerator;
  private _mutationPermissionGenerator: MutationPermissionGenerator;

  public constructor() {
    this._queryPermissionGenerator = new QueryPermissionGenerator();
    this._mutationPermissionGenerator = new MutationPermissionGenerator();
  }
  private _getViewsByName(views: IPgView[]): IViewsByName {
    const viewsByName: IViewsByName = {};

    views.forEach((view) => {
      if (viewsByName[view.name] != null) {
        throw new Error(`Duplicate generated view '${view.name}'.`);
      }

      viewsByName[view.name] = view;
    });

    return viewsByName;
  }
  private _getExistingViewsByName(existingViews: IExistingView[]): IExistingViewsByName {
    const existingViewsByName: IExistingViewsByName = {};

    existingViews.forEach((existingView) => {
      existingViewsByName[existingView.name] = existingView;
    });

    return existingViewsByName;
  }
  private async _getExistingViews(dbClient: PoolClient, schema: string): Promise<IExistingView[]> {
    const query: string = `
      SELECT 
        table_schema "schema", 
        table_name "name", 
        obj_description(('"' || table_schema || '"."' || table_name || '"')::regclass) "comment"
      FROM information_schema.views 
      WHERE table_schema = $1;
    `;

    const { rows } = await dbClient.query(query, [schema]);

    return rows.map((row) => {
      let hash: string | null = null;
      if (row.comment != null) {
        const splittedComment: string[] = row.comment.split("_");
        if (splittedComment[0] === "ONE" && splittedComment[1] != null) {
          hash = splittedComment[1];
        }
      }

      return {
        ...row,
        hash,
      };
    });
  }
  public async generate(
    schema: IDbSchema,
    dbClient: PoolClient,
    helpers: IHelpers
  ): Promise<IPermissionGeneratorResult> {
    let gqlTypeDefs: string = "";
    const commands: IGqlCommand[] = [];
    const views: IPgView[] = [];
    const resolverMappings: IResolverMapping[] = [];
    const defaultResolverMeta: IDefaultResolverMeta = {
      viewsSchemaName: schema.permissionViewSchema || "_gql",
      query: {},
      mutation: {},
    };

    if (schema.tables != null) {
      schema.tables.forEach((table) => {
        const expressionCompiler: ExpressionCompiler = new ExpressionCompiler(
          schema,
          table,
          helpers,
          LOCAL_TABLE_ALIAS,
          false
        );
        const rootExpressionCompiler: ExpressionCompiler = new ExpressionCompiler(
          schema,
          table,
          helpers,
          LOCAL_TABLE_ALIAS,
          true
        );

        // Generate READ Permissions
        const queryPermissions: IQueryPermissionGeneratorResult = this._queryPermissionGenerator.generate(
          schema,
          table,
          helpers,
          expressionCompiler,
          rootExpressionCompiler
        );

        queryPermissions.views.forEach((view) => {
          views.push(view);
        });
        queryPermissions.resolverMappings.forEach((resolverMapping) => {
          resolverMappings.push(resolverMapping);
        });
        gqlTypeDefs += `${queryPermissions.gqlTypeDefs}\n`;

        if (defaultResolverMeta.query[queryPermissions.queryViewMeta.name] != null) {
          throw new Error(`Duplicate query name: '${queryPermissions.queryViewMeta.name}'.`);
        }

        defaultResolverMeta.query[queryPermissions.queryViewMeta.name] = queryPermissions.queryViewMeta;

        // Generate READ Permissions
        const mutationExpressionCompiler: ExpressionCompiler = new ExpressionCompiler(
          schema,
          table,
          helpers,
          LOCAL_TABLE_ALIAS,
          true
        );
        const mutationsMeta: IMutationsMeta = this._mutationPermissionGenerator.generate(
          schema,
          table,
          helpers,
          mutationExpressionCompiler
        );

        mutationsMeta.views.forEach((view) => {
          views.push(view);
        });
        mutationsMeta.resolverMappings.forEach((resolverMapping) => {
          resolverMappings.push(resolverMapping);
        });
        gqlTypeDefs += `${mutationsMeta.gqlTypeDefs}\n`;

        mutationsMeta.mutationViewMetas.forEach((mutationViewMeta) => {
          if (defaultResolverMeta.mutation[mutationViewMeta.name] != null) {
            throw new Error(`Duplicate mutation name: '${mutationViewMeta.name}'.`);
          }
          defaultResolverMeta.mutation[mutationViewMeta.name] = mutationViewMeta;
        });
      });
    }

    const existingViews: IExistingView[] = await this._getExistingViews(
      dbClient,
      schema.permissionViewSchema || "_gql"
    );
    const existingViewsByName: IExistingViewsByName = this._getExistingViewsByName(existingViews);
    const viewsByName: IViewsByName = this._getViewsByName(views);

    // Find Views to delete
    existingViews.forEach((existingView) => {
      if (viewsByName[existingView.name] == null) {
        // Delete it
        commands.push({
          sqls: [
            `DROP VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(existingView.name)};`,
          ],
          operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 101,
        });
      }
    });

    // Find Views to add and change
    views.forEach((view) => {
      if (existingViewsByName[view.name] != null) {
        // Update it
        if (existingViewsByName[view.name].hash == null || existingViewsByName[view.name].hash !== sha1(view.sql)) {
          commands.push({
            sqls: [`DROP VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(view.name)};`],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 101,
          });
          commands.push({
            sqls: [
              view.sql,
              `COMMENT ON VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(
                view.name
              )} IS 'ONE_${sha1(view.sql)}_Your comment';`,
            ],
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100,
          });
        }
      } else {
        commands.push({
          sqls: [
            view.sql,
            `COMMENT ON VIEW ${getPgSelector(schema.permissionViewSchema || "_gql")}.${getPgSelector(
              view.name
            )} IS 'ONE_${sha1(view.sql)}_Your comment';`,
          ],
          operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100,
        });
      }
    });

    const result: IPermissionGeneratorResult = {
      defaultResolverMeta,
      gqlTypeDefs,
      resolverMappings,
      commands,
    };

    return result;
  }
}

export interface IPermissionGeneratorResult {
  defaultResolverMeta: IDefaultResolverMeta;
  gqlTypeDefs: string;
  resolverMappings: IResolverMapping[];
  commands: IGqlCommand[];
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
