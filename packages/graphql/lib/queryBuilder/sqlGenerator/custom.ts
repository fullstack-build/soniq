
import { operatorsObject } from '../../compareOperators';

export function generateCustomSql(match, customs, getParam, getField) {

  function createOperator(operatorName, fieldName, value) {
    if (operatorsObject[operatorName] == null) {
      throw new Error(`Operator '${operatorName}' not found.`);
    }

    const context = {
      field: getField(fieldName),
      value: null,
      values: null
    };
    if (operatorsObject[operatorName].unsafeValue === true) {
      if (Array.isArray(value)) {
        context.values = value;
      } else {
        context.value = value;
      }
    } else {
      if (Array.isArray(value)) {
        context.values = value.map(getParam);
      } else {
        context.value = getParam(value);
      }
    }

    const requiresArray = operatorsObject[operatorName].value[0] === '[';

    if (requiresArray === true && context.values == null) {
      throw new Error(`Operator '${operatorName}' requires an array of values.`);
    }
    if (requiresArray !== true && context.value == null) {
      throw new Error(`Operator '${operatorName}' requires a single value.`);
    }

    return operatorsObject[operatorName].getSql(context);
  }

  function createOperators(fieldName, field) {
    return Object.keys(field).map((operatorName) => {
      const value = field[operatorName];
      return createOperator(operatorName, fieldName, value);
    }).join(` AND `);
  }

  function createAndList(list) {
    return list.map(createFilter).join(` AND `);
  }

  function createOrList(list) {
    return list.map(createFilter).join(` OR `);
  }

  function createFilter(filter) {
    const sqlList = [];

    Object.keys(filter).forEach((fieldName) => {
      const field = filter[fieldName];
      if (fieldName === 'AND') {
        return sqlList.push(`(${createAndList(field)})`);
      }
      if (fieldName === 'OR') {
        return sqlList.push(`(${createOrList(field)})`);
      }
      sqlList.push(`(${createOperators(fieldName, field)})`);
    });

    return sqlList.join(` AND `);
  }

  let sql = '';

  if (customs.where != null) {
    if (match === true) {
      sql += ` AND `;
    } else {
      sql += ` WHERE `;
    }
    sql += `(${createFilter(customs.where)})`;
  }

  if (customs.orderBy != null) {
    let orderBy = customs.orderBy;
    if (Array.isArray(orderBy) !== true) {
      orderBy = [orderBy];
    }
    const orders = orderBy.map((option) => {
      const splitted = option.split('_');
      const order = splitted.pop();
      const fieldName = splitted.join('_');
      if (order !== 'ASC' && order !== 'DESC') {
        throw new Error(`OrderBy has an invalid value '${option}'.`);
      }
      return `${getField(fieldName)} ${order}`;
    });

    sql += ` ORDER BY ${orders.join(', ')}`;
  }

  if (customs.limit != null) {
    sql += ` LIMIT ${getParam(parseInt(customs.limit, 10))}`;
  }

  if (customs.offset != null) {
    sql += ` OFFSET ${getParam(parseInt(customs.offset, 10))}`;
  }

  return sql;
}
