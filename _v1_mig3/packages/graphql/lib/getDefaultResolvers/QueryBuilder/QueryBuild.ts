import { UserInputError } from "../../GraphqlErrors";
import { IParsedResolveInfo, IMatch } from "../types";
import { ClausesBuilder } from "./ClausesBuilder";
import { IQueryBuildObject, IQueryClauseObject } from "./types";
import { IDefaultResolverMeta, IQueryViewMeta, IQueryFieldMeta } from "../../RuntimeInterfaces";
import { OperatorsBuilder } from "../../logicalOperators";

export default class QueryBuild {
  private readonly defaultResolverMeta: IDefaultResolverMeta;
  private readonly queryName: string;
  private readonly values: Array<number | string> = [];
  private readonly isAuthenticated: boolean;
  private readonly sql: string;
  private currentIndex: number = -1;
  private authRequired: boolean = false;
  private useRootViews: boolean = false;
  private operatorsBuilder: OperatorsBuilder;

  constructor(
    operatorsBuilder: OperatorsBuilder,
    defaultResolverMeta: IDefaultResolverMeta,
    isAuthenticated: boolean,
    useRootViews: boolean,
    query: IParsedResolveInfo<IQueryClauseObject>,
    match: IMatch = null
  ) {
    this.operatorsBuilder = operatorsBuilder;
    this.defaultResolverMeta = defaultResolverMeta;
    this.isAuthenticated = isAuthenticated;
    this.useRootViews = useRootViews;
    this.sql = `SELECT ${this.jsonAgg(query, match)};`;
    this.queryName = query.name;
  }

  private jsonAgg(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch): string {
    const localName = this.getLocalAliasName();
    const tableSql = this.resolveTable(query, match);
    const sql = `(SELECT COALESCE(json_agg(row_to_json("${localName}")), '[]'::json) FROM (${tableSql}) "${localName}") "${query.name}"`;
    return sql;
  }

  private rowToJson(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch): string {
    const localTableName = this.getLocalAliasName();
    const tableSql = this.resolveTable(query, match);
    return `(SELECT row_to_json("${localTableName}") FROM (${tableSql}) "${localTableName}") "${query.name}"`;
  }

  private resolveTable(query: IParsedResolveInfo<IQueryClauseObject>, match: IMatch): string {
    const gqlTypeName: string = Object.keys(query.fieldsByTypeName)[0];
    const queryViewMeta: IQueryViewMeta = this.defaultResolverMeta.query[gqlTypeName];

    // First iteration always starts with jsonAgg and thus is an aggregation
    const isQueryRootLevel = this.currentIndex < 2 && match == null;
    if (isQueryRootLevel === true && queryViewMeta.disallowGenericRootLevelAggregation === true) {
      throw new UserInputError(`The type '${gqlTypeName}' cannot be accessed by a root level aggregation.`, { exposeDetails: true });
    }
    const fields = query.fieldsByTypeName[gqlTypeName];

    const localName = this.getLocalAliasName();

    const selectFieldExpressions: string[] = [];
    let authRequiredHere: boolean = false;

    Object.values(fields).forEach((field) => {
      if (queryViewMeta.fields[field.name] == null) {
        throw new UserInputError(`The field '${gqlTypeName}.${field.name}' is not available.`, { exposeDetails: true });
      }
      const fieldMeta: IQueryFieldMeta = queryViewMeta.fields[field.name];
      if (fieldMeta.authRequired) {
        this.authRequired = true;
        authRequiredHere = true;
      }
      if (fieldMeta.manyToOne != null || fieldMeta.oneToMany != null) {
        const idExpression =
          fieldMeta.manyToOne != null ? this.getColumnExpressionTemplate(fieldMeta, localName) : this.getColumnExpression("id", localName);

        const relationSql = this.resolveRelation(field, fieldMeta, localName, idExpression);

        selectFieldExpressions.push(relationSql);
      } else {
        selectFieldExpressions.push(`${this.getColumnExpressionTemplate(fieldMeta, localName)} "${field.name}"`);
      }
    });

    const getColumn = (columnName: string) => {
      const queryFieldMeta = Object.values(queryViewMeta.fields).find((field) => field.columnName === columnName);
      if (queryFieldMeta == null) {
        throw new Error(`Column '${columnName}' not found.`);
      }

      if (queryFieldMeta.authRequired) {
        this.authRequired = true;
        authRequiredHere = true;
      }

      return this.getColumnExpressionTemplate(queryFieldMeta, localName);
    };

    const joinConditionSql = this.generateJoinCondition(match, localName);
    // Need to generate clauses before getFromExpression since authRequiredHere might change
    const clausesBuilder = new ClausesBuilder(this.operatorsBuilder, this.pushValueAndGetSqlParam.bind(this), getColumn);
    const clausesSql = clausesBuilder.generate(query.args, joinConditionSql);

    const fromExpression = this.getFromExpression(queryViewMeta, localName, authRequiredHere);
    return [`SELECT ${selectFieldExpressions.join(", ")} FROM ${fromExpression}`, clausesSql].filter((sql) => sql !== "").join(" ");
  }

  private resolveRelation(
    query: IParsedResolveInfo<IQueryClauseObject>,
    fieldMeta: IQueryFieldMeta,
    localName: string,
    matchIdExpression: string
  ): string {
    if (fieldMeta.manyToOne != null) {
      const match: IMatch = {
        ownColumnExpression: matchIdExpression,
        foreignColumnName: "id"
      };
      return this.rowToJson(query, match);
    } else {
      const match: IMatch = {
        ownColumnExpression: matchIdExpression,
        foreignColumnName: fieldMeta.oneToMany.foreignColumnName
      };
      return this.jsonAgg(query, match);
    }
  }

  private pushValueAndGetSqlParam(value: number | string): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  private generateJoinCondition(match: IMatch, localName: string): string {
    if (match == null) return "";
    const fieldExpression = this.getColumnExpression(match.foreignColumnName, localName);
    return `${fieldExpression} = ${match.ownColumnExpression}`;
  }

  private getLocalAliasName() {
    this.currentIndex += 1;
    return `_local_${this.currentIndex}_`;
  }

  private getColumnExpression(name: string, localName: string): string {
    return `"${localName}"."${name}"`;
  }

  private getColumnExpressionTemplate(fieldMeta: IQueryFieldMeta, localName: string): string {
    if (fieldMeta.rootOnlyColumn === true && this.useRootViews !== true) {
      throw new UserInputError(`The field '${fieldMeta.fieldName}' is only accessible with root privileges.`, { exposeDetails: true });
    }
    return fieldMeta.columnSelectExpressionTemplate.split("{_local_table_}").join(localName);
  }

  private getFromExpression(queryViewMeta: IQueryViewMeta, localName: string, authRequired: boolean): string {
    // tslint:disable-next-line:prettier
    const viewName = this.useRootViews === true ? queryViewMeta.rootViewName : (authRequired === true ? queryViewMeta.authViewName : queryViewMeta.publicViewName);
    return `"${this.defaultResolverMeta.viewsSchemaName}"."${viewName}" AS "${localName}"`;
  }

  public getBuildObject(): IQueryBuildObject {
    return {
      sql: this.sql,
      values: this.values,
      queryName: this.queryName,
      useRootViews: this.useRootViews,
      authRequired: this.authRequired,
      subqueryCount: this.currentIndex + 1
    };
  }
}
