import { IDbMeta } from '../../IDbMeta';
import { DbAppClient } from '@fullstack-one/db';

const queryParser = [];

export function registerQueryParser(
  callback: (dbClient: DbAppClient, dbMeta: IDbMeta) => void): void {
  queryParser.push(callback);
}

// return all registered parser
export function getQueryParser(): any {
  return queryParser;
}
