function filterExpressions(expressionObject) {
  return expressionObject.gqlReturnType === "Boolean" && expressionObject.isRoot === true;
}

function getExpression(expressionObject) {
  return `(${expressionObject.sql})`;
}

export function createView(table, config, name, fields, expressions) {
  const statements = [];

  statements.push(`DROP VIEW IF EXISTS "${config.schemaName}"."${name}";`);

  let sql = `CREATE OR REPLACE VIEW "${config.schemaName}"."${name}" WITH (security_barrier) AS `;
  sql += `SELECT ${fields.join(", ")} FROM "${table.schemaName}"."${table.tableName}" AS "_local_table_"`;

  const conditionExpressions = expressions.filter(filterExpressions);

  if (conditionExpressions.length > 0) {
    sql += ` WHERE ${conditionExpressions.map(getExpression).join(" OR ")}`;
  }

  sql += " WITH CHECK OPTION;";

  statements.push(sql);

  statements.push(`GRANT INSERT ON "${config.schemaName}"."${name}" TO "${config.userName}";`);

  return statements;
}
