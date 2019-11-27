import { IQueryClauseObject, INestedFilter } from "../types";
import { FilterBuilder } from "./FilterBuilder";
import { UserInputError } from "../../../GraphqlErrors";
import { OperatorsBuilder } from "../../../logicalOperators";

export class ClausesBuilder {
  private getParam: (value: any) => string;
  private getColumn: (columnName: string) => string;
  private filterBuilder: FilterBuilder;

  constructor(operatorsBuilder: OperatorsBuilder, getParam: (value: any) => string, getColumn: (columnName: string) => string) {
    this.filterBuilder = new FilterBuilder(operatorsBuilder, getParam, getColumn);
    this.getParam = getParam;
    this.getColumn = getColumn;
  }

  private generateWhereClause(filter: INestedFilter, extraFilterSql: string) {
    const filterSql = filter != null ? this.filterBuilder.generate(filter) : "";
    if (filterSql === "" && extraFilterSql === "") return "";
    if (filterSql === "") return `WHERE ${extraFilterSql}`;
    if (extraFilterSql === "") return `WHERE ${filterSql}`;
    return `WHERE (${extraFilterSql}) AND (${filterSql})`;
  }

  private generateOrderByClause(orderBy?: string[] | string) {
    if (orderBy == null) return "";

    const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
    const orders = orderByArray.map((option) => {
      const splitted = option.split("_");
      const order = splitted.pop();
      const fieldName = splitted.join("_");
      if (order !== "ASC" && order !== "DESC") {
        throw new UserInputError(`OrderBy has an invalid value '${option}'.`, { exposeDetails: true });
      }
      return `${this.getColumn(fieldName)} ${order}`;
    });

    return `ORDER BY ${orders.join(", ")}`;
  }

  private generateLimitClause(limit?: string) {
    if (limit == null) return "";
    return `LIMIT ${this.getParam(parseInt(limit, 10))}`;
  }

  private generateOffsetClause(offset?: string) {
    if (offset == null) return "";
    return `OFFSET ${this.getParam(parseInt(offset, 10))}`;
  }

  public generate({ where, orderBy, limit, offset }: IQueryClauseObject, extraFilter: string) {
    const whereClause = this.generateWhereClause(where, extraFilter);
    const orderByClause = this.generateOrderByClause(orderBy);
    const limitClause = this.generateLimitClause(limit);
    const offsetClause = this.generateOffsetClause(offset);

    return [whereClause, orderByClause, limitClause, offsetClause].filter((clause) => clause.length > 0).join(" ");
  }
}
