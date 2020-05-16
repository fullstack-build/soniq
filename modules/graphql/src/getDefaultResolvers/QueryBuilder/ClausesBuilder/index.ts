import { IQueryClauseObject, INestedFilter } from "../types";
import { FilterBuilder } from "./FilterBuilder";
import { UserInputError } from "../../../GraphqlErrors";
import { OperatorsBuilder } from "../../../logicalOperators";

export class ClausesBuilder {
  private _getParam: (value: unknown) => string;
  private _getColumn: (columnName: string) => string;
  private _filterBuilder: FilterBuilder;

  public constructor(
    operatorsBuilder: OperatorsBuilder,
    getParam: (value: unknown) => string,
    getColumn: (columnName: string) => string
  ) {
    this._filterBuilder = new FilterBuilder(operatorsBuilder, getParam, getColumn);
    this._getParam = getParam;
    this._getColumn = getColumn;
  }

  private _generateWhereClause(filter: INestedFilter | null | undefined, extraFilterSql: string): string {
    const filterSql: string = filter != null ? this._filterBuilder.generate(filter) : "";
    if (filterSql === "" && extraFilterSql === "") return "";
    if (filterSql === "") return `WHERE ${extraFilterSql}`;
    if (extraFilterSql === "") return `WHERE ${filterSql}`;
    return `WHERE (${extraFilterSql}) AND (${filterSql})`;
  }

  private _generateOrderByClause(orderBy?: string[] | string): string {
    if (orderBy == null) return "";

    const orderByArray: string[] = Array.isArray(orderBy) ? orderBy : [orderBy];
    const orders: string[] = orderByArray.map((option) => {
      const splitted: string[] = option.split("_");
      const order: string | undefined = splitted.pop();
      const fieldName: string = splitted.join("_");
      if (order !== "ASC" && order !== "DESC") {
        throw new UserInputError(`OrderBy has an invalid value '${option}'.`, {
          exposeDetails: true,
        });
      }
      return `${this._getColumn(fieldName)} ${order}`;
    });

    return `ORDER BY ${orders.join(", ")}`;
  }

  private _generateLimitClause(limit?: string): string {
    if (limit == null) return "";
    return `LIMIT ${this._getParam(parseInt(limit, 10))}`;
  }

  private _generateOffsetClause(offset?: string): string {
    if (offset == null) return "";
    return `OFFSET ${this._getParam(parseInt(offset, 10))}`;
  }

  public generate({ where, orderBy, limit, offset }: IQueryClauseObject, extraFilter: string): string {
    const whereClause: string = this._generateWhereClause(where, extraFilter);
    const orderByClause: string = this._generateOrderByClause(orderBy);
    const limitClause: string = this._generateLimitClause(limit);
    const offsetClause: string = this._generateOffsetClause(offset);

    return [whereClause, orderByClause, limitClause, offsetClause].filter((clause) => clause.length > 0).join(" ");
  }
}
