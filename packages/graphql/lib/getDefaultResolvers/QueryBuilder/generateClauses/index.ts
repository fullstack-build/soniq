import { IQueryClauseObject, INestedFilter } from "../types";
import getGenerateFilterFn from "./getGenerateFilterFn";

export default function generateClauses(
  hasMatch: boolean,
  { where, orderBy, limit, offset }: IQueryClauseObject,
  getParam: (value: number) => string,
  getField: (fieldName: string) => string
): string {
  const whereClause = generateWhereClause(hasMatch, getParam, getField, where);
  const orderByClause = generateOrderByClause(getField, orderBy);
  const limitClause = generateLimitClause(getParam, limit);
  const offsetClause = generateOffsetClause(getParam, offset);

  return [whereClause, orderByClause, limitClause, offsetClause].filter((clause) => clause.length > 0).join(" ");
}

function generateWhereClause(
  hasMatch: boolean,
  getParam: (value: number) => string,
  getField: (fieldName: string) => string,
  filter?: INestedFilter
) {
  if (filter == null) return "";
  return `${hasMatch ? "AND" : "WHERE"} (${getGenerateFilterFn(getParam, getField)(filter)})`;
}

function generateOrderByClause(getField: (fieldName: string) => string, orderBy?: string[] | string) {
  if (orderBy == null) return "";

  const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
  const orders = orderByArray.map((option) => {
    const splitted = option.split("_");
    const order = splitted.pop();
    const fieldName = splitted.join("_");
    if (order !== "ASC" && order !== "DESC") {
      throw new Error(`OrderBy has an invalid value '${option}'.`);
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
