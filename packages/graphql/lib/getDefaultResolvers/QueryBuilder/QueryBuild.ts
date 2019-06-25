import { AuthenticationError, UserInputError } from "apollo-server-koa";
import { IReadViewMeta, IResolverMeta, IReadFieldData, IDbMeta, IDbRelation } from "@fullstack-one/schema-builder";
import { IParsedResolveInfo, IMatch } from "../types";
import generateClauses from "./generateClauses";
import { IQueryBuildOject, IQueryClauseObject, ICostTree } from "./types";
import calculateMaxDepth from "./calculateMaxDepth";

export default class QueryBuild {
  private readonly resolverMeta: IResolverMeta;
  private readonly dbMeta: IDbMeta;
  private readonly queryName: string;
  private readonly values: Array<number | string> = [];
  private readonly isAuthenticated: boolean;
  private readonly minQueryDepthToCheckCostLimit: number;
  private readonly sql: string;
  private readonly rootCostTree: ICostTree;
  private currentIndex: number = -1;
  private authRequired: boolean = false;

  constructor(
    resolverMeta: IResolverMeta,
    dbMeta: IDbMeta,
    isAuthenticated: boolean,
    minQueryDepthToCheckCostLimit: number,
    query: IParsedResolveInfo<IQueryClauseObject>,
    match: IMatch = null
  ) {
    this.dbMeta = dbMeta;
    this.resolverMeta = resolverMeta;
    this.isAuthenticated = isAuthenticated;
    this.minQueryDepthToCheckCostLimit = minQueryDepthToCheckCostLimit;
    this.rootCostTree = { subtrees: [] };
    this.sql = `SELECT ${this.jsonAgg(query, match, this.rootCostTree)};`;
    this.queryName = query.name;
  }

  private jsonAgg(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch, costTree: ICostTree): string {
    const localName = this.getLocalAliasName();
    costTree.queryName = query.name;
    costTree.type = "aggregation";
    const tableSql = this.resolveTable(query, match, costTree);
    const sql = `(SELECT COALESCE(json_agg(row_to_json("${localName}")), '[]'::json) FROM (${tableSql}) "${localName}") "${query.name}"`;
    return sql;
  }

  private rowToJson(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch, costTree: ICostTree): string {
    const localTableName = this.getLocalAliasName();
    costTree.queryName = query.name;
    costTree.type = "row";
    const tableSql = this.resolveTable(query, match, costTree);
    return `(SELECT row_to_json("${localTableName}") FROM (${tableSql}) "${localTableName}") "${query.name}"`;
  }

  private resolveTable(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch, costTree: ICostTree): string {
    const gqlTypeName: string = Object.keys(query.fieldsByTypeName)[0];
    const gqlTypeMeta: IReadViewMeta = this.resolverMeta.query[gqlTypeName];
    const gqlTypePermissionMeta = this.resolverMeta.permissionMeta[gqlTypeName] || {};

    costTree.tableName = gqlTypeMeta.tableName;
    costTree.tableSchemaName = gqlTypeMeta.tableSchemaName;
    costTree.limit = query.args.limit;

    // First iteration always starts with jsonAgg and thus is an aggregation
    const isQueryRootLevel = this.currentIndex < 2 && match == null;
    if (isQueryRootLevel === true && gqlTypePermissionMeta.disallowGenericRootLevelAggregation === true) {
      const error = new UserInputError(`The type '${gqlTypeName}' cannot be accessed by a root level aggregation.`);
      error.extensions.exposeDetails = true;
      throw error;
    }
    const fields = query.fieldsByTypeName[gqlTypeName];

    const localName = this.getLocalAliasName();

    const selectFieldExpressions: string[] = [];
    let authRequiredHere: boolean = false;

    Object.values(fields).forEach((field) => {
      if (gqlTypeMeta.fields[field.name] == null) {
        const error = new UserInputError(`The field '${gqlTypeName}.${field.name}' is not available.`);
        error.extensions.exposeDetails = true;
        throw error;
      }
      const fieldMeta = gqlTypeMeta.fields[field.name];
      if (!gqlTypeMeta.publicFieldNames.includes(field.name) && fieldMeta.nativeFieldName != null) {
        this.authRequired = true;
        authRequiredHere = true;
        if (this.isAuthenticated !== true) {
          const error = new AuthenticationError(`The field '${gqlTypeName}.${field.name}' is not available without authentication.`);
          error.extensions = {
            ...error.extensions,
            exposeDetails: true,
            message: `The field '${gqlTypeName}.${field.name}' is not available without authentication.`
          };
          throw error;
        }
      }
      if (fieldMeta.meta != null && fieldMeta.meta.relationName != null) {
        const idExpression =
          fieldMeta.meta.isListType === false
            ? this.getFieldExpression(fieldMeta.nativeFieldName, localName)
            : this.getFieldExpression("id", localName);

        const subCostTree: ICostTree = { subtrees: [] };
        costTree.subtrees.push(subCostTree);
        const relationSql = this.resolveRelation(field, fieldMeta, localName, idExpression, subCostTree);

        selectFieldExpressions.push(relationSql);
      } else {
        selectFieldExpressions.push(`${this.getFieldExpression(field.name, localName)} "${field.name}"`);
      }
    });

    const getField = (fieldName: string) => {
      const readFieldData = Object.values(gqlTypeMeta.fields).find((field) => field.nativeFieldName === fieldName);
      if (readFieldData == null) throw new Error(`Field '${fieldName}' not found.`);
      const virtualFieldName: string = readFieldData.gqlFieldName;

      if (!gqlTypeMeta.publicFieldNames.includes(virtualFieldName)) {
        this.authRequired = true;
        authRequiredHere = true;
        if (this.isAuthenticated !== true) {
          const error = new AuthenticationError(`The field '${gqlTypeName}.${fieldName}' is not available without authentication.`);
          error.extensions = {
            ...error.extensions,
            exposeDetails: true,
            message: `The field '${gqlTypeName}.${fieldName}' is not available without authentication.`
          };
          throw error;
        }
      }
      return this.getFieldExpression(fieldName, localName);
    };

    const joinConditionSql = this.generateJoinCondition(match, localName);
    // Need to generate clauses before getFromExpression since authRequiredHere might change
    const clausesSql: string = generateClauses(query.args, this.pushValueAndGetSqlParam.bind(this), getField, joinConditionSql);

    const fromExpression = this.getFromExpression(gqlTypeMeta, localName, authRequiredHere);
    return [`SELECT ${selectFieldExpressions.join(", ")} FROM ${fromExpression}`, clausesSql].filter((sql) => sql !== "").join(" ");
  }

  private resolveRelation(
    query: IParsedResolveInfo<IQueryClauseObject>,
    fieldMeta: IReadFieldData,
    localName: string,
    matchIdExpression: string,
    costTree: ICostTree
  ): string {
    const { ownRelation, foreignRelation } = this.getOwnAndForeignRelation(fieldMeta);
    if (ownRelation.type === "ONE") {
      const match: IMatch = {
        type: "SIMPLE",
        fieldExpression: matchIdExpression,
        foreignFieldName: "id"
      };
      return this.rowToJson(query, match, costTree);
    }

    if (foreignRelation.type === "MANY") {
      const arrayMatch: IMatch = {
        type: "ARRAY",
        fieldExpression: this.getFieldExpression(ownRelation.columnName, localName),
        foreignFieldName: "id"
      };

      return this.jsonAgg(query, arrayMatch, costTree);
    } else {
      const match: IMatch = {
        type: "SIMPLE",
        fieldExpression: matchIdExpression,
        foreignFieldName: foreignRelation.columnName
      };
      match.foreignFieldName = foreignRelation.columnName;
      return this.jsonAgg(query, match, costTree);
    }
  }

  private getOwnAndForeignRelation(fieldMeta: IReadFieldData): { ownRelation: IDbRelation; foreignRelation: IDbRelation } {
    const relationConnections = this.dbMeta.relations[fieldMeta.meta.relationName];
    const relationConnectionsArray: IDbRelation[] = Object.values(relationConnections);
    const isFirstRelation = relationConnectionsArray[0].tableName === fieldMeta.meta.table.tableName;
    const ownRelation = isFirstRelation === true ? relationConnectionsArray[0] : relationConnectionsArray[1];
    const foreignRelation = isFirstRelation !== true ? relationConnectionsArray[0] : relationConnectionsArray[1];
    return { ownRelation, foreignRelation };
  }

  private pushValueAndGetSqlParam(value: number | string): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  private generateJoinCondition(match: IMatch, localName: string): string {
    if (match == null) return "";
    const fieldExpression = this.getFieldExpression(match.foreignFieldName, localName);
    if (match.type === "SIMPLE") return `${fieldExpression} = ${match.fieldExpression}`;
    return `${match.fieldExpression} @> ARRAY[${fieldExpression}]::uuid[]`;
  }

  private getLocalAliasName() {
    this.currentIndex += 1;
    return `_local_${this.currentIndex}_`;
  }

  private getFieldExpression(name: string, localName: string): string {
    return `"${localName}"."${name}"`;
  }

  private getFromExpression(gqlTypeMeta: IReadViewMeta, localName: string, authRequired: boolean): string {
    const viewName = authRequired === true ? gqlTypeMeta.authViewName : gqlTypeMeta.publicViewName;
    return `"${gqlTypeMeta.viewSchemaName}"."${viewName}" AS "${localName}"`;
  }

  public getBuildObject(): IQueryBuildOject {
    const maxDepth = calculateMaxDepth(this.rootCostTree);
    const potentialHighCost = maxDepth >= this.minQueryDepthToCheckCostLimit;
    return {
      sql: this.sql,
      values: this.values,
      queryName: this.queryName,
      authRequired: this.authRequired,
      maxDepth,
      potentialHighCost,
      costTree: this.rootCostTree
    };
  }
}
