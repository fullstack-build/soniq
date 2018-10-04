export function checkQueryResult(column, result, logger) {
  if (Array.isArray(result) === true) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many queries in result. Request denied.");
    throw new Error("InjectionProtector: To many queries.");
  }
  if (result.rowCount > 1 || result.rows.length > 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many rows in result. Request denied.");
    throw new Error("InjectionProtector: To many rows.");
  }
  if (result.rowCount < 1 || result.rows.length < 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To less rows in result. Request denied.");
    throw new Error("InjectionProtector: To less rows.");
  }
  const data = result.rows[0];
  const keys = Object.keys(data);
  if (keys.length > 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many columns in result. Request denied.");
    throw new Error("InjectionProtector: To many columns.");
  }
}

export function checkQuery() {
  return;
}
