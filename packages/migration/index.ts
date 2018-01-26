import * as _ from 'lodash';
import * as One from '../core';
import { migrationObject } from './migrationObject';

import { sqlArray } from './sqlArray';

import { IAction } from './IMigrationSqlObj';

export class Migration extends One.AbstractPackage {

  private readonly fromDbMeta: One.IDbMeta;
  private readonly toDbMeta: One.IDbMeta;
  private readonly migrationObject: One.IDbMeta;

  constructor(fromDbMeta: One.IDbMeta,
              toDbMeta: One.IDbMeta) {
    super();

    // check if toDbMeta is empty -> Parsing error
    if (toDbMeta == null || Object.keys(toDbMeta).length === 0) {
      throw new Error(`Migration Error: Provided migration final state is empty.`);
    }

    // crete copy of objects
    // new
    this.fromDbMeta = _.cloneDeep(fromDbMeta);
    // remove views and exposed names
    delete fromDbMeta.exposedNames;

    // old
    this.toDbMeta = _.cloneDeep(toDbMeta);
    // remove views and exposed names
    delete toDbMeta.exposedNames;
    // remove graphql // todo graphql from config
    delete toDbMeta.schemas.graphql;

    // getSqlFromMigrationObj diff with actions
    this.migrationObject = migrationObject.createFromTwoDbMetaObjects(this.fromDbMeta, this.toDbMeta);

  }

  public getMigrationDbMeta(): One.IDbMeta {
    return _.cloneDeep(this.migrationObject);
  }

  public getSqlStatements(renameInsteadOfDrop: boolean = true): string[] {
    return sqlArray.getSqlFromMigrationObj(this.migrationObject, this.toDbMeta, renameInsteadOfDrop);
  }

}
