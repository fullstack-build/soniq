import * as _ from 'lodash';
import * as deepmerge from 'deepmerge';

import * as FullstackOne from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';
import { pgToDbObject } from '../db/pgToDbObject';

const ACTION_KEY = '$$action$$';
const DELETED_PREFIX = '_deleted:';

export namespace migration {
  let createDrop = false;

  export async function createMigration(pCreateDrop: boolean = false) {
    const $one = FullstackOne.getInstance();
    createDrop = pCreateDrop;

    try {
      // write parsed schema into migrations folder
      /*await graphQlHelper.writeTableObjectIntoMigrationsFolder(
        `${this.ENVIRONMENT.path}/migrations/`,
        tableObjects,
        optionalMigrationId,
      );
      // emit event
      this.emit('schema.dbObject.migration.saved');*/

      // tslint:disable-next-line:no-console
      // console.log(JSON.stringify($one.getDbObject(), null, 2));

      // tslint:disable-next-line:no-console
      // console.log('############### dbObjectFromPG:');
      const dbObjectFromPg = await pgToDbObject($one);
      // tslint:disable-next-line:no-console
      // console.log(JSON.stringify(dbObjectFromPg, null, 2));

      // const sqlStatements = await createSqlFromDbObject($one.getDbObject());
      /*
      // tslint:disable-next-line:no-console
      console.log('############### UP:');
      // tslint:disable-next-line:no-console
      console.log(sqlStatements.up.join('\n'));
      // tslint:disable-next-line:no-console
      console.log('############### DOWN:');
      // copy, so we can reverse it without destroying original
      const downMigrations = sqlStatements.down.slice(0);
      // tslint:disable-next-line:no-console
      console.log(downMigrations.reverse().join('\n'));

      // tslint:disable-next-line:no-console
      console.log('############### DELTA:');
      // tslint:disable-next-line:no-console
      console.log(createDeltaSQLFromTwoDbObjects(dbObjectFromPg, $one.getDbObject()).join('\n'));
*/
      // tslint:disable-next-line:no-console
      console.log('############### DELTA:');
      const deltaMigrations = createDeltaSqlFromTwoDbObjects($one.getDbObject(), dbObjectFromPg);
      // tslint:disable-next-line:no-console
      console.log(deltaMigrations.join('\n'));

      // emit event
      // this.emit('schema.dbObject.migration.up.executed');

      // const viewSqlStatements = createViewsFromDbObject($one.getDbObject(), 'appuserhugo', false);
      // tslint:disable-next-line:no-console
      // console.log(viewSqlStatements.join('\n'));

      // display result sql in terminal
      // this.logger.debug(sqlStatements.join('\n'));
    } catch (err) {

      // tslint:disable-next-line:no-console
      console.log('err', err);
      // this.logger.warn('loadFilesByGlobPattern error', err);
      // emit event
      // this.emit('schema.load.error');
    }
  }

  export function createDeltaSqlFromTwoDbObjects(pDbObjectNew: FullstackOne.IDbObject,
                                                 pDbObjectOld: FullstackOne.IDbObject): string[] {

    // crete copy of objects
    // new
    const dbObjectNew = _.cloneDeep(pDbObjectNew);
    // remove views
    delete dbObjectNew.views;
    delete dbObjectNew.exposedNames;
    // old
    const dbObjectOld = _.cloneDeep(pDbObjectOld);
    // remove views and exposed names
    delete dbObjectOld.views;
    delete dbObjectOld.exposedNames;

    const deltaDbObjectRemove: any = _removeEmptyObjects(_difference(dbObjectOld, dbObjectNew));
    const deltaDbObjectRemoveWithActions = _addToEveryNote(deltaDbObjectRemove, ACTION_KEY, { remove:true });
    const deltaDbObjectAdd: any = _removeEmptyObjects(_difference(dbObjectNew, dbObjectOld));
    const deltaDbObjectAddWithAction = _addToEveryNote(deltaDbObjectAdd, ACTION_KEY, { add:true });

    // use deepmerge instead of _.merge.
    // _.merge does some crazy shit -> confuses references
    const deltaDbObjFinal = deepmerge(deltaDbObjectRemoveWithActions, deltaDbObjectAddWithAction);

    const sqlCommands = createSqlFromDbObject(deltaDbObjFinal, pDbObjectOld);

    return sqlCommands;
  }

  /*
  export function OLDcreateDeltaSQLFromTwoDbObjects(dbObjectOld: FullstackOne.IDbObject, dbObjectNew: FullstackOne.IDbObject) {
    const migrationOld = createSqlFromDbObject(dbObjectOld);
    const migrationNew = createSqlFromDbObject(dbObjectNew);

    let deltaSqlCommands = [];

    // find all that are in old but not in new -> run down
    const deltaInOldNotInNew = Object.entries(migrationOld.up).filter((entry) => {
      return (!migrationNew.up.includes(entry[1]));
    });

    // collect down migrations
    deltaSqlCommands.push('-- DOWN');
    const downMigrations = [];
    Object.values(deltaInOldNotInNew).forEach((delta) => {
      const deltaIndex = delta[0];
      const downMigration = migrationOld.down[deltaIndex];
      downMigrations.push(downMigration);
    });

    // run down migrations reversed
    downMigrations.reverse();
    deltaSqlCommands = deltaSqlCommands.concat(downMigrations);

    // find all that are in new but not in old -> ups
    const deltaInNewNotInOld = Object.entries(migrationNew.up).filter((entry) => {
      return (!migrationOld.up.includes(entry[1]));
    });

    // collect down migrations
    deltaSqlCommands.push('-- UP');
    Object.values(deltaInNewNotInOld).forEach((delta) => {
      const deltaIndex = delta[0];
      const upMigration = migrationNew.up[deltaIndex];
      deltaSqlCommands.push(upMigration);
    });

    // remove unnecessary commands for renamed columns, tables and schemas
    let filteredDeltaSqlCommands = [...deltaSqlCommands];
    deltaSqlCommands.forEach((statement) => {
      // column
      if (
        statement.indexOf('ALTER TABLE') !== -1 &&
        statement.indexOf('RENAME COLUMN TO') !== -1 &&
        statement.indexOf(DELETED_PREFIX) === -1) {
        // tslint:disable-next-line:no-console
        console.error('## COLUMN');

        const myRegexp = /ALTER TABLE .* RENAME COLUMN "(.*)" TO "(.*)"+/g;
        const match = myRegexp.exec(statement);
        const oldName = match[1];
        const newName = match[2];

        if (oldName != null && newName != null) {
          filteredDeltaSqlCommands = deltaSqlCommands.filter((subStatement) => {
            return (
              subStatement.indexOf(`ADD COLUMN "${newName}"`) === -1
              &&
              subStatement.indexOf(`ALTER COLUMN "${oldName}" TYPE varchar`) === -1
              &&
              subStatement.indexOf(`RENAME COLUMN "${oldName}" TO "${DELETED_PREFIX}${oldName}"`) === -1
              &&
              subStatement.indexOf(`DROP COLUMN IF EXISTS "${oldName}"`) === -1
            );
          });

          // check if anything was removed, if not => remove rename colums -> done already
          if (deltaSqlCommands.length === filteredDeltaSqlCommands.length) {
            filteredDeltaSqlCommands = filteredDeltaSqlCommands.filter(e => e !== statement);
          }

        }
      } else if (
        statement.indexOf('ALTER TABLE') !== -1 &&
        statement.indexOf('RENAME TO') !== -1 &&
        statement.indexOf(DELETED_PREFIX) === -1) { // table

        const myRegexp = /ALTER TABLE "(.*)" RENAME TO "(.*)"+/g;
        const match = myRegexp.exec(statement);
        const oldName = `"${match[1]}"`;
        const newName = match[2];
        // tslint:disable-next-line:no-console
        console.error('## TABLE', oldName, newName);

      }
    });

    return filteredDeltaSqlCommands;
  }
  */

  function _getActionAndValuesFromNode(node): {action: string, node: any} {
    const actionObj = (node != null) ? node[ACTION_KEY] : null;
    let action = null;

    if (actionObj == null) {
      action = null;
    } else if (actionObj.add != null && actionObj.remove == null) {
      action = 'add';
    } else if (actionObj.add == null && actionObj.remove != null) {
      action = 'remove';
    }
    // remove action from obj
    if (actionObj != null) {
      delete node[ACTION_KEY];
    }

    return {
      action,
      node
    };
  }

  export function createSqlFromDbObject(
    deltaDbObj: FullstackOne.IDbObject,
    currentDbObject: FullstackOne.IDbObject
  ): string[] {
    const sqlCommands = {
      up: [],
      down: []
    };

    // create enum types first
    if (deltaDbObj.enums != null) {
      Object.entries(deltaDbObj.enums).map((enumTypeArray) => {
        // ignore actions
        if (enumTypeArray[0] !== ACTION_KEY) {
          createSqlForEnumObject(sqlCommands, enumTypeArray[0], enumTypeArray[1]);
        }
      });
    }

    if (deltaDbObj.schemas != null) {
      const schemas = _getActionAndValuesFromNode(deltaDbObj.schemas).node;
      // iterate over database schemas
      Object.entries(schemas).map((schemaEntry) => {

        const schemaName = schemaEntry[0];
        const schemaDefinition = schemaEntry[1];

        createSqlFromSchemaObject(sqlCommands, schemaName, schemaDefinition);

        // iterate over database tables
        if (schemaDefinition != null) {
          const tables = _getActionAndValuesFromNode(schemaDefinition.tables).node;
          Object.entries(tables).map((tableEntry) => {
            const tableName = tableEntry[0];
            const tableObject = tableEntry[1];
            createSqlFromTableObject(sqlCommands, schemaName, tableName, tableObject);
          });
        }
      });
    }

    // iterate over database relations
    if (deltaDbObj.relations != null) {
      const relations = _getActionAndValuesFromNode(deltaDbObj.relations).node;

      Object.values(relations).map((
        relationObj: { [tableName: string]: FullstackOne.IDbRelation }
      ) => {
        const relationDefinition: FullstackOne.IDbRelation[] = Object.values(_getActionAndValuesFromNode(relationObj).node);

        // write error for many-to-many
        if (relationDefinition[0].type === 'MANY' && relationDefinition[1] != null && relationDefinition[1].type === 'MANY') {
          process.stdout.write(
            'migration.relation.unsupported.type: ' +
            `${relationDefinition[0].name}: ${relationDefinition[0].tableName}:${relationDefinition[1].tableName} => MANY:MANY` + '\n' +
            'Many to many relations are not yet supported by the query builder. Create a through table instead.\n'
          );

          createSqlManyToManyRelation(sqlCommands, relationDefinition);
        } else {

          if (relationDefinition[0].type === 'ONE' && relationDefinition[1] != null && relationDefinition[1].type === 'ONE') {
            process.stdout.write(
              'migration.relation.type.hint: ' +
              `${relationDefinition[0].name}: ${relationDefinition[0].tableName}:${relationDefinition[1].tableName} => ONE:ONE` + '\n' +
              'Try to avoid using one to one relations.' +
              'Consider combining both entities into one, using JSON type instead or pointing only in one direction.\n'
            );
          }

          // create one:many / one:one relation
          createRelation(sqlCommands, relationDefinition);
        }
      });
    }

    // return down statemens reversed and before up statements
    return sqlCommands.down.reverse().concat(sqlCommands.up);
  }

  function createSqlForEnumObject(sqlCommands, enumTypeName, enumTypeValue) {
    const { action, node } = _getActionAndValuesFromNode(enumTypeValue);
    const enumValues = Object.values(node);

    if (action === 'add') {
      sqlCommands.up.push(`CREATE TYPE "${enumTypeName}" AS ENUM ('${enumValues.join('\',\'')}');`);
    } else if (action === 'remove') {
      sqlCommands.down.push(`DROP TYPE "${enumTypeName}";`);
    }
  }

  function createSqlFromSchemaObject(sqlCommands, schemaName: string, schemDefinition: any) {

    const { action, node } = _getActionAndValuesFromNode(schemDefinition);

    // avoid dropping or createing public schema
    if (schemaName !== 'public') {

      if (action === 'add') {
        // create schema statement
        sqlCommands.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
      } else if (action === 'remove') {
        // drop or rename schema
        if (createDrop) {
          sqlCommands.down.push(`DROP SCHEMA IF EXISTS "${schemaName}";`);
        } else { // create rename instead
          sqlCommands.down.push(`ALTER SCHEMA "${schemaName}" RENAME TO "${DELETED_PREFIX}${schemaName}";`);
        }
      }
    }

  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlCommands, schemaName, tableName, tableObject: any) {
    const { action, node } = _getActionAndValuesFromNode(tableObject);

    const tableNameWithSchema = `"${schemaName}"."${tableName}"`;

    // only if table needs to be created
    if (tableObject.name != null) {
      if (action === 'add') {
        // create table statement
        sqlCommands.up.push(`CREATE TABLE ${tableNameWithSchema}();`);
      } else if (action === 'remove') {
        // create or rename table
        if (createDrop) {
          sqlCommands.down.push(`DROP TABLE IF EXISTS ${tableNameWithSchema};`);
        } else { // create rename instead, ignore if already renamed
          if (tableObject.name.indexOf(DELETED_PREFIX) !== 0) {
            sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} RENAME TO "${DELETED_PREFIX}${tableObject.name}";`);
          } else {
            sqlCommands.down.push(`-- Table ${tableNameWithSchema} was already renamed instead of deleted.`);
          }
        }
      }
    }

    // iterate columns
    if (tableObject.columns != null) {
      const columns = _getActionAndValuesFromNode(tableObject.columns).node;
      for (const columnObject of Object.entries(columns)) {
        const columnName = columnObject[0];
        const columnDefinition = columnObject[1];
        createSqlFromColumnObject(sqlCommands, schemaName, tableName, columnName, columnDefinition);
      }
    }

    // generate constraints for column
    if (tableObject.constraints != null) {
      const constraints = _getActionAndValuesFromNode(tableObject.constraints).node;
      for (const constraintObject of Object.entries(constraints)) {
        const constraintName = constraintObject[0];
        const constraintDefinition = constraintObject[1];
        createSqlFromConstraintObject(sqlCommands, schemaName, tableName, constraintName, constraintDefinition);
      }
    }

  }

  function createSqlFromColumnObject(sqlCommands, schemaName, tableName, columnName, columnObject: any) {
    const { action, node } = _getActionAndValuesFromNode(columnObject);

    const tableNameWithSchema = `"${schemaName}"."${tableName}"`;

    if (node.type === 'computed') {
      // ignore computed
    } else if (node.type === 'customResolver') {
      // ignore custom
    } else if (node.type === 'relation') {
      // ignore relations
    } else {

      let type = node.type;
      // is type an enum/custom?
      if (type === 'enum') {
        type = `"${node.customType}"`;
      } else if (type === 'customType') {
        type = `${node.customType}`;
      }
      // mandatory column data is set
      if (columnName != null && type != null) {

        if (action === 'add') {
          // create column statement
          sqlCommands.up.push(`ALTER TABLE ${tableNameWithSchema} ADD COLUMN "${columnName}" varchar;`);
        } else if (action === 'remove') {
          // drop or rename
          if (createDrop) {
            sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchema} DROP COLUMN IF EXISTS "${columnName}" CASCADE;`);
          } else { // create rename instead
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${columnName}" TO "${DELETED_PREFIX}${columnName}";`
            );
          }
        }

        // for every column that should not be removed
        if (action == null || action === 'add') {
          // set or change column type
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" TYPE ${type} USING "${columnName}"::${type};`
          );
        }

      }

    }

    // add default values
    if (node.defaultValue != null) {
      if (node.defaultValue.isExpression) {
        // set default - expression
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" SET DEFAULT ${node.defaultValue.value};`
          );
        }  else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      } else {
        // set default - value
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" SET DEFAULT '${node.defaultValue.value}';`
          );
        }  else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      }
    }

  }

  function createSqlFromConstraintObject(sqlCommands, schemaName, tableName, constraintName, constraintObject) {
    const { action, node } = _getActionAndValuesFromNode(constraintObject);

    const tableNameWithSchema = `"${schemaName}"."${tableName}"`;

    const columnsObj = _getActionAndValuesFromNode(node.columns).node;
    const columnNamesAsStr = (node.columns != null) ?
      Object.values(columnsObj).map(columnName => `"${columnName}"`).join(',') : null;

    switch (node.type) {
      case 'not_null':
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN ${columnNamesAsStr} SET NOT NULL;`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN ${columnNamesAsStr} DROP NOT NULL;`
            );
          }
        }
        break;
      case 'PRIMARY KEY':
        /* moved to graphQlSchemaToDbObject -> expression
				// convention: all PKs are generated uuidv4
				node.columns.forEach((columnName) => {
					sqlCommands.up.push(
						`ALTER TABLE ${tableName} ALTER COLUMN "${columnName}" SET DEFAULT uuid_generate_v4();`
					);
				});
				*/

        // make sure column names for constraint are set
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" PRIMARY KEY (${columnNamesAsStr});`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT "${constraintName}";`
            );
          }
        }
        break;
      case 'UNIQUE':
        // make sure column names for constraint are set
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNamesAsStr});`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT "${constraintName}";`
            );
          }
        }
        break;
      case 'CHECK':
        const checkExpression = node.options.param1;
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" CHECK (${checkExpression});`
          );
        } else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT "${constraintName}";`
          );
        }
        break;
    }

  }

  function createRelation(sqlCommands, relationObject: FullstackOne.IDbRelation[]) {

    relationObject.map(createSqlRelation);
    function createSqlRelation(oneRelation: FullstackOne.IDbRelation) {

      const { action, node } = _getActionAndValuesFromNode(oneRelation);

      // ignore the 'MANY' side
      if (node.type === 'ONE') {
        const tableName = `"${node.schemaName}"."${node.tableName}"`;

        // create column for FK // convention: uuid
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableName} ADD COLUMN "${node.columnName}" uuid;`
          );
        } else if (action === 'remove') {
          // drop or rename column
          if (createDrop) {
            sqlCommands.down.push(
              `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS "${node.columnName}" CASCADE;`
            );
          } else {
            sqlCommands.down.push(
              `ALTER TABLE ${tableName} RENAME COLUMN "${node.columnName}" TO "${DELETED_PREFIX}${node.columnName}";`
            );
          }
        }

        // add foreign key
        const constraintName = `fk_${node.name}`;
        // drop constraint is needed for up and down
        const downConstraintStatement = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}"`;
        // first we need to drop a possible existing one, in order to update onUpdate and onDelete
        let upConstraintStatement = `${downConstraintStatement}, `;
        // and add a new version with all attributes
        upConstraintStatement += `ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${node.columnName}") ` +
          `REFERENCES "${node.reference.schemaName}"."${node.reference.tableName}"("${node.reference.columnName}")`;

        // check onUpdate and onDelete
        if (node.onDelete != null) {
          upConstraintStatement += ` ON DELETE ${node.onDelete}`;
        }
        if (node.onUpdate != null) {
          upConstraintStatement += ` ON UPDATE ${node.onUpdate}`;
        }

        if (action === 'add') {
          sqlCommands.up.push(
            upConstraintStatement + ';'
          );
          sqlCommands.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS '${JSON.stringify(relationObject)}';`);
        } else if (action === 'remove') {
          sqlCommands.down.push(
            downConstraintStatement + ';'
          );
          // drop or rename column
          if (createDrop) {
            sqlCommands.down.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS NULL;`);
          }
        }
      }
    }

  }

  function createSqlManyToManyRelation(sqlCommands, relationObject: FullstackOne.IDbRelation[]) {

    const relation1 = _getActionAndValuesFromNode(relationObject[0]);
    const actionRelation1 = relation1.action;
    const definitionRelation1 = relation1.node;
    const relation2 = _getActionAndValuesFromNode(relationObject[1]);
    const actionRelation2 = relation2.action;
    const definitionRelation2 = relation2.node;

    // relation 1
    const tableName1 = `"${definitionRelation1.schemaName}"."${definitionRelation1.tableName}"`;
    if (actionRelation1 === 'add') {
      // create fk column 1
      sqlCommands.up.push(
        `ALTER TABLE ${tableName1} ADD COLUMN "${definitionRelation1.columnName}" uuid[];`
      );

      // add comment with meta information
      sqlCommands.up.push(`COMMENT ON COLUMN ${tableName1}."${definitionRelation1.columnName}" IS '${JSON.stringify(definitionRelation1)}';`);

    } else if (actionRelation1 === 'remove') {

      // drop or rename column
      if (createDrop) {
        // remove fk column 1
        sqlCommands.down.push(
          `ALTER TABLE ${tableName1} DROP COLUMN IF EXISTS "${definitionRelation1.columnName}" CASCADE;`
        );
        // remove meta information
        sqlCommands.down.push(`COMMENT ON COLUMN ${tableName1}."${definitionRelation1.columnName}" IS NULL;`);
      } else { // create rename instead
        sqlCommands.down.push(
          `ALTER TABLE ${tableName1} RENAME COLUMN "${definitionRelation1.columnName}" TO "${DELETED_PREFIX}${definitionRelation1.columnName}";`
        );
      }

    }

    // relation2
    const tableName2 = `"${definitionRelation2.schemaName}"."${definitionRelation2.tableName}"`;
    if (actionRelation2 === 'add') {
      // create fk column 2
      sqlCommands.up.push(
        `ALTER TABLE ${tableName2} ADD COLUMN "${definitionRelation2.columnName}" uuid[];`
      );

      // add comment with meta information
      sqlCommands.up.push(`COMMENT ON COLUMN ${tableName2}."${definitionRelation2.columnName}" IS '${JSON.stringify(definitionRelation2)}';`);

    } else if (actionRelation2 === 'remove') {
      // drop or rename column
      if (createDrop) {
        // remove fk column 2
        sqlCommands.down.push(
          `ALTER TABLE ${tableName2} DROP COLUMN IF EXISTS "${definitionRelation2.columnName}" CASCADE;`
        );

        // remove meta information
        sqlCommands.down.push(`COMMENT ON COLUMN ${tableName2}."${definitionRelation2.columnName}" IS NULL;`);
      } else { // create rename instead
        sqlCommands.down.push(
          `ALTER TABLE ${tableName2} RENAME COLUMN "${definitionRelation2.columnName}" TO "${DELETED_PREFIX}${definitionRelation2.columnName}";`
        );
      }
    }

    // todo create trigger to check consistency and cascading
  }
}

/**
 * Helper
 */

/**
 * Deep diff between two object, using lodash
 * @param  {Object} obj Object compared
 * @param  {Object} base  Object to compare with
 * @param  {boolean} ignoreValue  Ignore different string, number and boolean values
 * @return {Object}        Return a new object who represent the diff
 */
function _difference(obj: {}, base: {}, ignoreValue: boolean = false) {
  function changes(pObj, pBase) {
    return _.transform(pObj, (result, value, key) => {
      let thisValue = value;
      // ignore different string, number and boolean values
      if (!!ignoreValue) {
        // ignoring done by replacing old value with new value
        if (typeof thisValue === 'string' || typeof thisValue === 'number' || typeof thisValue === 'boolean') {
          thisValue = pBase[key];
        }
      }
      // deep equal
      if (!_.isEqual(thisValue, pBase[key])) {
        result[key] = (_.isObject(thisValue) && _.isObject(pBase[key])) ? changes(thisValue, pBase[key]) : thisValue;
      }
    });
  }
  return changes(obj, base);
}

/**
 * Deep add key and value to last node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
function _addToLastNote(obj: {}, addKey: string, addValue: any) {
  function nested(pObj) {
    return _.transform(pObj, (result, value, key) => {
      // check if object has children
      const hasChildren = (Object.values(pObj).find((thisVal) => {
        return _.isObject(thisVal);
      }) != null);
      // add to last node
      if (!hasChildren) {
        result[addKey] = addValue;
      }
      // recursion
      result[key] = (_.isObject(value)) ? nested(value) : value;
    });
  }
  return nested(obj);
}

/**
 * Deep add key and value to every node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
function _addToEveryNote(obj: {}, addKey: string, addValue: any) {
  function nested(pObj) {
    return _.transform(pObj, (result, value, key) => {
      // add to very "object" node
      result[addKey] = addValue;
      // recursion
      result[key] = (_.isObject(value)) ? nested(value) : value;
    });
  }
  return nested(obj);
}

/**
 * Deep removal of empty objects, using lodash
 * @param  {Object} obj Object to be cleaned
 * @return {Object}        Return a new cleaned up object
 */
function _removeEmptyObjects(obj: {}) {
  return _(obj)
  .pickBy(_.isObject) // pick objects only
  .mapValues(_removeEmptyObjects) // call only for object values
  .omitBy(_.isEmpty) // remove all empty objects
  .assign(_.omitBy(obj, _.isObject)) // assign back primitive values
  .value();
}
