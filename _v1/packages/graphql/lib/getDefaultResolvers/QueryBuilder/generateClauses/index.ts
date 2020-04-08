import { IQueryClauseObject, INestedFilter } from "../types";
import getGenerateFilterFn from "./getGenerateFilterFn";
import { UserInputError } from "../../../GraphqlErrors";

export default function generateClauses(
  { where, orderBy, limit, offset }: IQueryClauseObject,
  getParam: (value: number | string) => string,
  getField: (fieldName: string) => string,
  extraFilter: string = ""
): string {
  const whereClause = generateWhereClause(getParam, getField, where, extraFilter);
  const orderByClause = generateOrderByClause(getField, orderBy);
  const limitClause = generateLimitClause(getParam, limit);
  const offsetClause = generateOffsetClause(getParam, offset);

  return [whereClause, orderByClause, limitClause, offsetClause].filter((clause) => clause.length > 0).join(" ");
}

function generateWhereClause(
  getParam: (value: number) => string,
  getField: (fieldName: string) => string,
  filter: INestedFilter,
  extraFilterSql: string
) {
  const filterSql = filter != null ? getGenerateFilterFn(getParam, getField)(filter) : "";
  if (filterSql === "" && extraFilterSql === "") return "";
  if (filterSql === "") return `WHERE ${extraFilterSql}`;
  if (extraFilterSql === "") return `WHERE ${filterSql}`;
  return `WHERE (${extraFilterSql}) AND (${filterSql})`;
}

function generateOrderByClause(getField: (fieldName: string) => string, orderBy?: string[] | string) {
  if (orderBy == null) return "";

  const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
  const orders = orderByArray.map((option) => {
    const splitted = option.split("_");
    const order = splitted.pop();
    const fieldName = splitted.join("_");
    if (order !== "ASC" && order !== "DESC") {
      throw new UserInputError(`OrderBy has an invalid value '${option}'.`, { exposeDetails: true });
    }
    return `${getField(fieldName)} ${order}`;
  });

  return `ORDER BY ${orders.join(", ")}`;
}

function generateLimitClause(getParam: (value: number) => string, limit?: string) {
  if (limit == null) return "";
  return `LIMIT ${getParam(parseInt(limit, 10))}`;
}

function generateOffsetClause(getParam: (value: number) => string, offset?: string) {
  if (offset == null) return "";
  return `OFFSET ${getParam(parseInt(offset, 10))}`;
}
