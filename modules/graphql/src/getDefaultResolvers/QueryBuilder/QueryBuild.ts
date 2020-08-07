import { UserInputError } from "../../GraphqlErrors";
import { IMatch } from "../types";
import { ClausesBuilder } from "./ClausesBuilder";
import { IQueryBuildObject } from "./types";
import { IDefaultResolverMeta, IQueryViewMeta, IQueryFieldMeta } from "../../RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";
import { ResolveTree } from "graphql-parse-resolve-info";

export default class QueryBuild {
  private readonly _defaultResolverMeta: IDefaultResolverMeta;
  private readonly _queryName: string;
  private readonly _values: (number | string)[] = [];
  private readonly _isAuthenticated: boolean;
  private readonly _sql: string;
  private _currentIndex: number = -1;
  private _authRequired: boolean = false;
  private _useRootViews: boolean = false;
  private _operatorsBuilder: OperatorsBuilder;

  public constructor(
    operatorsBuilder: OperatorsBuilder,
    defaultResolverMeta: IDefaultResolverMeta,
    isAuthenticated: boolean,
    useRootViews: boolean,
    query: ResolveTree,
    match: IMatch | null = null
  ) {
    this._operatorsBuilder = operatorsBuilder;
    this._defaultResolverMeta = defaultResolverMeta;
    this._isAuthenticated = isAuthenticated;
    this._useRootViews = useRootViews;
    this._sql = `SELECT ${this._jsonAgg(query, match)};`;
    this._queryName = query.name;
  }

  private _jsonAgg(query: ResolveTree, match: IMatch | null): string {
    const localName: string = this._getLocalAliasName();
    const tableSql: string = this._resolveTable(query, match);
    const sql: string = `(SELECT COALESCE(json_agg(row_to_json("${localName}")), '[]'::json) FROM (${tableSql}) "${localName}") "${query.name}"`;
    return sql;
  }

  private _rowToJson(query: ResolveTree, match: IMatch): string {
    const localTableName: string = this._getLocalAliasName();
    const tableSql: string = this._resolveTable(query, match);
    return `(SELECT row_to_json("${localTableName}") FROM (${tableSql}) "${localTableName}") "${query.name}"`;
  }

  private _resolveTable(query: ResolveTree, match: IMatch | null): string {
    const gqlTypeName: string = Object.keys(query.fieldsByTypeName)[0];
    const queryViewMeta: IQueryViewMeta = this._defaultResolverMeta.query[gqlTypeName];

    // First iteration always starts with jsonAgg and thus is an aggregation
    const isQueryRootLevel: boolean = this._currentIndex < 2 && match == null;
    if (isQueryRootLevel === true && queryViewMeta.disallowGenericRootLevelAggregation === true) {
      throw new UserInputError(`The type '${gqlTypeName}' cannot be accessed by a root level aggregation.`);
    }
    const fields: {
      [fieldName: string]: ResolveTree;
    } = query.fieldsByTypeName[gqlTypeName];

    const localName: string = this._getLocalAliasName();

    const selectFieldExpressions: string[] = [];
    let authRequiredHere: boolean = false;

    Object.values(fields).forEach((field) => {
      if (queryViewMeta.fields[field.name] == null) {
        throw new UserInputError(`The field '${gqlTypeName}.${field.name}' is not available.`);
      }
      const fieldMeta: IQueryFieldMeta = queryViewMeta.fields[field.name];
      if (fieldMeta.authRequired) {
        this._authRequired = true;
        authRequiredHere = true;
      }
      if (fieldMeta.manyToOne != null || fieldMeta.oneToMany != null) {
        const idExpression: string =
          fieldMeta.manyToOne != null
            ? this._getColumnExpressionTemplate(fieldMeta, localName)
            : this._getColumnExpression("id", localName);

        const relationSql: string = this._resolveRelation(field, fieldMeta, localName, idExpression);

        selectFieldExpressions.push(relationSql);
      } else {
        selectFieldExpressions.push(`${this._getColumnExpressionTemplate(fieldMeta, localName)} "${field.name}"`);
      }
    });

    const getColumn: (columnName: string) => string = (columnName: string) => {
      const queryFieldMeta: IQueryFieldMeta | undefined = Object.values(queryViewMeta.fields).find(
        (field) => field.columnName === columnName
      );
      if (queryFieldMeta == null) {
        throw new Error(`Column '${columnName}' not found.`);
      }

      if (queryFieldMeta.authRequired) {
        this._authRequired = true;
        authRequiredHere = true;
      }

      return this._getColumnExpressionTemplate(queryFieldMeta, localName);
    };

    const joinConditionSql: string = this._generateJoinCondition(match, localName);
    // Need to generate clauses before getFromExpression since authRequiredHere might change
    const clausesBuilder: ClausesBuilder = new ClausesBuilder(
      this._operatorsBuilder,
      this._pushValueAndGetSqlParam.bind(this),
      getColumn
    );
    const clausesSql: string = clausesBuilder.generate(query.args, joinConditionSql);

    const fromExpression: string = this._getFromExpression(queryViewMeta, localName, authRequiredHere);
    return [`SELECT ${selectFieldExpressions.join(", ")} FROM ${fromExpression}`, clausesSql]
      .filter((sql) => sql !== "")
      .join(" ");
  }

  private _resolveRelation(
    query: ResolveTree,
    fieldMeta: IQueryFieldMeta,
    localName: string,
    matchIdExpression: string
  ): string {
    if (fieldMeta.manyToOne != null) {
      const match: IMatch = {
        ownColumnExpression: matchIdExpression,
        foreignColumnName: "id",
      };
      return this._rowToJson(query, match);
    }
    if (fieldMeta.oneToMany != null) {
      const match: IMatch = {
        ownColumnExpression: matchIdExpression,
        foreignColumnName: fieldMeta.oneToMany.foreignColumnName,
      };
      return this._jsonAgg(query, match);
    }
    throw new Error("Unknown relation");
  }

  private _pushValueAndGetSqlParam(value: number | string): string {
    this._values.push(value);
    return `$${this._values.length}`;
  }

  private _generateJoinCondition(match: IMatch | null, localName: string): string {
    if (match == null) return "";
    const fieldExpression: string = this._getColumnExpression(match.foreignColumnName, localName);
    return `${fieldExpression} = ${match.ownColumnExpression}`;
  }

  private _getLocalAliasName(): string {
    this._currentIndex += 1;
    return `_local_${this._currentIndex}_`;
  }

  private _getColumnExpression(name: string, localName: string): string {
    return `"${localName}"."${name}"`;
  }

  private _getColumnExpressionTemplate(fieldMeta: IQueryFieldMeta, localName: string): string {
    if (fieldMeta.rootOnlyColumn === true && this._useRootViews !== true) {
      throw new UserInputError(`The field '${fieldMeta.fieldName}' is only accessible with root privileges.`);
    }
    if (fieldMeta.columnSelectExpressionTemplate == null) {
      throw new Error("columnSelectExpressionTemplate is missing in fieldMeta");
    }
    return fieldMeta.columnSelectExpressionTemplate.split("{_local_table_}").join(localName);
  }

  private _getFromExpression(queryViewMeta: IQueryViewMeta, localName: string, authRequired: boolean): string {
    const viewName: string =
      this._useRootViews === true
        ? queryViewMeta.rootViewName
        : authRequired === true
        ? queryViewMeta.authViewName
        : queryViewMeta.publicViewName;
    return `"${this._defaultResolverMeta.viewsSchemaName}"."${viewName}" AS "${localName}"`;
  }

  public getBuildObject(): IQueryBuildObject {
    return {
      sql: this._sql,
      values: this._values,
      queryName: this._queryName,
      useRootViews: this._useRootViews,
      authRequired: this._authRequired,
      subqueryCount: this._currentIndex + 1,
    };
  }
}
