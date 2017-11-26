
import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

export default (obj, args, context, info) => {
  const fieldsByTypeName = parseResolveInfo(info);
  const sqlString = 'null';

  return sqlString;
};
