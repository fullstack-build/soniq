import * as _ from 'lodash';
import * as deepmerge from 'deepmerge';
import * as deepEqual from 'deep-equal';

import * as F1 from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';
import { isExpressionValueUsed } from 'tsutils';
import { isObject } from 'util';
import { IDbObject } from '../core/IDbObject';

interface IAction {
  ignore: boolean;
  add: boolean;
  remove: boolean;
  rename: boolean;
  change: boolean;
}

interface ISqlObj {
  up: undefined[];
  down: undefined[];
}

interface IMigrationSqlObj {
  version: number;
  schemas?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
      tables?: {
        [name: string]: {
          name: string;
          sql: ISqlObj;
          columns: {
            [name: string]:
              {
                name: string;
                sql: ISqlObj;
              }
          };
          constraints?: {
            sql: ISqlObj;
          };
        };
      }
    }
  };
  enums?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
    };
  };
  relations?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
    };
  };
}

export namespace migration {
  const ACTION_KEY: string = '$$action$$';
  const DELETED_PREFIX: string = '_deleted:';
  let renameInsteadOfDrop: boolean = true;
  let dbObjectFrom: F1.IDbObject = null;
  let dbObjectTo: F1.IDbObject = null;
  let migrationDbObject: any = null;

  export function createMigrationSqlFromTwoDbObjects(pDbObjectFrom: F1.IDbObject,
                                                     pDbObjectTo: F1.IDbObject,
                                                     pRenameInsteadOfDrop: boolean = true): string[] {

    renameInsteadOfDrop = pRenameInsteadOfDrop;

    // check if dbObjectTo is empty -> Parsing error
    if (pDbObjectTo == null || Object.keys(pDbObjectTo).length === 0) {
      throw new Error(`Migration Error: Provided migration final state is empty.`);
    }

    // crete copy of objects
    // new
    dbObjectFrom = _.cloneDeep(pDbObjectFrom);
    // remove views and exposed names
    delete dbObjectFrom.exposedNames;

    // old
    dbObjectTo = _.cloneDeep(pDbObjectTo);
    // remove views and exposed names
    delete dbObjectTo.exposedNames;
    // remove graphql // todo
    delete dbObjectTo.schemas.graphql;

    migrationDbObject = _diffAndAddActions(dbObjectFrom, dbObjectTo);

    return _sqlMigrationObjToSqlStatements(createMigrationSqlObjFromDeltaDbObject());
  }

  function _sqlMigrationObjToSqlStatements(sqlMigrationObj: IMigrationSqlObj): string[] {
    const sqlStatements = [];

    // create, drop and recreate enums
    if (sqlMigrationObj.enums != null) {
      Object.values(sqlMigrationObj.enums).forEach((enumSqlObj) => {
        // add down statements first (enum change or rename)
        _addStatemensArrayToSqlStatemts(enumSqlObj.sql.down);
        // add up statements
        _addStatemensArrayToSqlStatemts(enumSqlObj.sql.up);
      });
    }

    // create tables
    if (sqlMigrationObj.schemas != null) {
      Object.values(sqlMigrationObj.schemas).forEach((schemaSqlObj) => {
        // no need to create schemas, they will be generated with tables
        // create tables
        if (schemaSqlObj.tables != null) {
          Object.values(schemaSqlObj.tables).forEach((tableSqlObj) => {
            // add table up statements
            _addStatemensArrayToSqlStatemts(tableSqlObj.sql.up);

            // drop relations
            if (sqlMigrationObj.relations != null) {
              Object.values(sqlMigrationObj.relations).forEach((relationSqlObj) => {
                // add drop statements
                _addStatemensArrayToSqlStatemts(relationSqlObj.sql.down);
              });
            }

            // drop constraints
            if (tableSqlObj.constraints != null) {
              // add down statements reversed order
              _addStatemensArrayToSqlStatemts(tableSqlObj.constraints.sql.down.reverse());
            }

            // create columns
            if (tableSqlObj.columns != null) {
              Object.values(tableSqlObj.columns).forEach((columnSqlObj) => {
                // add up statements
                _addStatemensArrayToSqlStatemts(columnSqlObj.sql.up);
                // add down statements reversed order
                _addStatemensArrayToSqlStatemts(columnSqlObj.sql.down.reverse());
              });
            }

            // create constraints
            if (tableSqlObj.constraints != null) {
              // add up statements
              _addStatemensArrayToSqlStatemts(tableSqlObj.constraints.sql.up);
            }

            // add table down statements
            _addStatemensArrayToSqlStatemts(tableSqlObj.sql.down);

          });
        }
      });
    }

    // create relations
    if (sqlMigrationObj.relations != null) {
      Object.values(sqlMigrationObj.relations).forEach((relationSqlObj) => {
        // add up statements
        _addStatemensArrayToSqlStatemts(relationSqlObj.sql.up);
      });
    }

    // drop schemas
    if (sqlMigrationObj.schemas != null) {
      Object.values(sqlMigrationObj.schemas).forEach((schemasSqlObj) => {
        // add down statements
        _addStatemensArrayToSqlStatemts(schemasSqlObj.sql.down);
      });
    }

    function _addStatemensArrayToSqlStatemts(statementsArray) {
      Object.values(statementsArray).forEach((statement) => {
        // only push each ones
        if (sqlStatements.indexOf(statement) === -1) {
          sqlStatements.push(statement);
        }
      });
    }

    return sqlStatements;
  }

  function _splitActionFromNode(node: {} = {}): {action: IAction, node: any} {
    const action = node[ACTION_KEY] || {};
    // remove action from obj
    delete node[ACTION_KEY];

    return {
      action,
      node
    };
  }

  function createMigrationSqlObjFromDeltaDbObject(): IMigrationSqlObj {
    const sqlMigrationObj: IMigrationSqlObj = {
      version: 1.0,
      schemas: {
        public: { // public schema is available per default
          name: 'public',
          sql: {
            up: [],
            down: []
          },
          tables: {}
        }
      },
      enums: {},
      relations: {}
    };

    // create enum types first
    if (migrationDbObject.enums != null) {
      const enums = _splitActionFromNode(migrationDbObject.enums).node;
      Object.entries(enums).map((enumTypeArray) => {
        createSqlForEnumObject(sqlMigrationObj, enumTypeArray[0], enumTypeArray[1]);
      });
    }

    if (migrationDbObject.schemas != null) {
      const schemas = _splitActionFromNode(migrationDbObject.schemas).node;

      // iterate over database schemas
      Object.entries(schemas).map((schemaEntry) => {

        const schemaName = schemaEntry[0];
        const schemaDefinition = schemaEntry[1];

        createSqlFromSchemaObject(sqlMigrationObj, schemaName, schemaDefinition);

        // iterate over database tables
        if (schemaDefinition != null && schemaDefinition.tables != null) {
          const tables = _splitActionFromNode(schemaDefinition.tables).node;
          Object.entries(tables).map((tableEntry) => {
            const tableName = tableEntry[0];
            const tableObject = tableEntry[1];
            createSqlFromTableObject(sqlMigrationObj, schemaName, tableName, tableObject);
          });
        }
      });
    }

    // iterate over database relations
    if (migrationDbObject.relations != null) {
      const relations = _splitActionFromNode(migrationDbObject.relations).node;

      Object.values(relations).map((
        relationObj: { [tableName: string]: F1.IDbRelation }
      ) => {
        const relationDefinition: F1.IDbRelation[] = Object.values(_splitActionFromNode(relationObj).node);

        // write error for many-to-many
        if (relationDefinition[0].type === 'MANY' && relationDefinition[1] != null && relationDefinition[1].type === 'MANY') {
          process.stdout.write(
            'migration.relation.unsupported.type: ' +
            `${relationDefinition[0].name}: ${relationDefinition[0].tableName}:${relationDefinition[1].tableName} => MANY:MANY` + '\n' +
            'Many to many relations are not yet supported by the query builder. Create a through table instead.\n'
          );

          createSqlManyToManyRelation(sqlMigrationObj, relationDefinition[0].name, relationDefinition);
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
          createRelation(sqlMigrationObj, relationDefinition[0].name, relationDefinition);
        }
      });
    }

    // return down statemens reversed and before up statements
    return sqlMigrationObj;
  }

  function _createEmptySqlObj(name?: string) {
    return {
      name,
      sql: {
        up: [],
        down: []
      }
    };
  }

  function createSqlForEnumObject(sqlMigrationObj, enumTypeName, enumTypeValue) {

    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.enums[enumTypeName] =
      sqlMigrationObj.enums[enumTypeName] || _createEmptySqlObj(enumTypeName);
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(enumTypeValue);
    const values = _splitActionFromNode(node.values).node;
    const enumValues = Object.values(values);

    // add and remove can both happen at the same time (e.g. when changing value => recreate)
    if (action.add) {
      thisSql.up.push(`CREATE TYPE "${enumTypeName}" AS ENUM ('${enumValues.join('\',\'')}');`);
    }
    if (action.remove) {

      // get all columns that use this Type and cast them to varchar
      // will be executed in opposite order -> first cast than drop type
      const enumColumns = _splitActionFromNode(node.columns).node;
      Object.values(enumColumns).forEach((enumColumn) => {
        const enumColumnNode = _splitActionFromNode(enumColumn).node;
        if (enumColumnNode.schemaName != null && enumColumnNode.tableName != null && enumColumnNode.columnName != null) {
          thisSql.down.push(
            `ALTER TABLE "${enumColumnNode.schemaName}"."${enumColumnNode.tableName}" ` +
            `ALTER COLUMN "${enumColumnNode.columnName}" TYPE "varchar" USING "${enumColumnNode.columnName}"::"varchar";`
          );
        }
      });

      // drop type
      thisSql.down.push(`DROP TYPE "${enumTypeName}";`);
    }
  }

  function createSqlFromSchemaObject(sqlMigrationObj, schemaName: string, schemDefinition: any) {

    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.schemas[schemaName] =
      sqlMigrationObj.schemas[schemaName] || _createEmptySqlObj(schemaName);
    // add tables to schema
    thisSqlObj.tables = thisSqlObj.tables  || {};
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(schemDefinition);

    // avoid dropping or createing public schema
    if (schemaName !== 'public') {

      if (action.add) {
        // don't create schema, it will be created automatically with table creation
        // thisSql.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
      } else if (action.remove) {
        // drop or rename schema
        if (!renameInsteadOfDrop) {
          thisSql.down.push(`DROP SCHEMA IF EXISTS "${schemaName}";`);
        } else { // create rename instead
          thisSql.down.push(`ALTER SCHEMA "${schemaName}" RENAME TO "${DELETED_PREFIX}${schemaName}";`);
        }
      }
    }

  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlMigrationObj, schemaName, tableName, tableDefinition: any) {

    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.schemas[schemaName].tables[tableName] =
      sqlMigrationObj.schemas[schemaName].tables[tableName] || _createEmptySqlObj(tableName);
    // add columns to table
    thisSqlObj.columns = thisSqlObj.columns  || {};
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(tableDefinition);

    // use the current table name, otherwise name of node
    // (in case it got removed on dbObject merge)
    const tableNameUp   = node.name || tableName;
    const tableNameDown = (action.rename) ? node.oldName : tableNameUp;
    const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
    const tableNameWithSchemaDown = `"${schemaName}"."${tableNameDown}"`;

    // only if table needs to be created
    if (tableDefinition.name != null) {
      if (action.add) {

        // create table statement
        thisSql.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
        thisSql.up.push(`CREATE TABLE ${tableNameWithSchemaUp}();`);

      } else if (action.remove) {

        // create or rename table
        if (!renameInsteadOfDrop) {

          thisSql.down.push(`DROP TABLE IF EXISTS ${tableNameWithSchemaDown};`);
        } else { // create rename instead, ignore if already renamed

          if (tableDefinition.name.indexOf(DELETED_PREFIX) !== 0) {
            thisSql.down.push(`ALTER TABLE ${tableNameWithSchemaDown} RENAME TO "${DELETED_PREFIX}${node.name}";`);
          } else {
            thisSql.down.push(`-- Table ${tableNameWithSchemaDown} was already renamed instead of deleted.`);
          }
        }
      } else if (action.rename) {

        // move to other schema in down, so that it happens BEFORE old schema gets removed and table gets renamed
        if (node.oldSchemaName != null && node.schemaName != null && node.oldSchemaName !== node.schemaName) {
          // create schema first if not available yet
          thisSql.up.push(`CREATE SCHEMA IF NOT EXISTS "${node.schemaName}";`);
          thisSql.up.push(`ALTER TABLE "${node.oldSchemaName}"."${node.oldName}" SET SCHEMA "${node.schemaName}";`);
        }
        // don't rename if old and new names are equal (could happen when movig from one schema to another)
        if (node.oldName !== node.name) {
          thisSql.up.push(`ALTER TABLE "${schemaName}"."${node.oldName}" RENAME TO "${node.name}";`);
        }
      }
    }

    // iterate columns
    if (tableDefinition.columns != null) {
      const columns = _splitActionFromNode(tableDefinition.columns).node;
      for (const columnObject of Object.entries(columns)) {
        const columnName = columnObject[0];
        const columnDefinition = columnObject[1];
        createSqlFromColumnObject(sqlMigrationObj, schemaName, tableNameUp, columnName, columnDefinition);
      }
    }

    // generate constraints for column
    if (tableDefinition.constraints != null) {
      const constraints = _splitActionFromNode(tableDefinition.constraints).node;
      for (const constraintObject of Object.entries(constraints)) {
        const constraintName = constraintObject[0];
        const constraintDefinition = constraintObject[1];
        createSqlFromConstraintObject(sqlMigrationObj, schemaName, tableNameUp, constraintName, constraintDefinition);
      }
    }

  }

  function createSqlFromColumnObject(sqlMigrationObj, schemaName, tableName, columnName, columnObject: any) {

    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.schemas[schemaName].tables[tableName].columns[columnName] =
      sqlMigrationObj.schemas[schemaName].tables[tableName].columns[columnName] || _createEmptySqlObj(columnName);
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(columnObject);

    const tableNameWithSchema = `"${schemaName}"."${tableName}"`;

    if (node.type === 'computed') {
      // ignore computed
    } else if (node.type === 'customResolver') {
      // ignore custom
    } else if (node.type === 'relation') {
      // ignore relations
    } else {

      let type = node.type;
      // is type an enum/custom or just a customType change of an existing type
      if (type === 'enum' || type === 'customType' || (type == null && node.customType != null)) {
        type = `${node.customType}`;
      }

      if (action.add && node.name != null) {
        // create column statement
        thisSql.up.push(`ALTER TABLE ${tableNameWithSchema} ADD COLUMN "${node.name}" varchar;`);
      } else if (action.remove) {

        // drop or rename
        if (!renameInsteadOfDrop) {
          thisSql.down.push(`ALTER TABLE ${tableNameWithSchema} DROP COLUMN IF EXISTS "${node.name}" CASCADE;`);
        } else { // create rename instead
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${node.name}" TO "${DELETED_PREFIX}${node.name}";`
          );
        }
      } else if (action.rename && node.oldName != null && node.name != null) {
        thisSql.up.push(
          `ALTER TABLE ${tableNameWithSchema} RENAME COLUMN "${node.oldName}" TO "${node.name}";`
        );
      }

      // for every column that should not be removed
      if (action != null && !action.remove && type != null && columnName != null) {
        // set or change column type
        thisSql.up.push(
          `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" TYPE "${type}" USING "${columnName}"::"${type}";`
        );
      }

    }

    // add default values
    if (node.defaultValue != null && node.defaultValue.value != null) {
      if (node.defaultValue.isExpression) {
        // set default - expression
        if (action.add) {
          thisSql.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" SET DEFAULT ${node.defaultValue.value};`
          );
        }  else if (action.remove) {
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      } else {
        // set default - value
        if (action.add) {
          thisSql.up.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" SET DEFAULT '${node.defaultValue.value}';`
          );
        }  else if (action.remove) {
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      }
    }

  }

  function createSqlFromConstraintObject(sqlMigrationObj, schemaName, tableName, constraintName, constraintObject) {

    // create sql object if it doesn't exist
    // up
    const thisSqlObj = sqlMigrationObj.schemas[schemaName].tables[tableName].constraints =
      sqlMigrationObj.schemas[schemaName].tables[tableName].constraints || _createEmptySqlObj();
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(constraintObject);

    const tableNameWithSchema = `"${schemaName}"."${tableName}"`;

    const columnsObj = _splitActionFromNode(node.columns).node;
    const columnNamesAsStr = (node.columns != null) ?
      Object.values(columnsObj).map(columnName => `"${columnName}"`).join(',') : null;

    switch (node.type) {
      case 'not_null':
        if (columnNamesAsStr != null) {
          if (action.add) {
            thisSql.up.push(
              `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN ${columnNamesAsStr} SET NOT NULL;`
            );
          } else if (action.remove) {
            thisSql.down.push(
              `ALTER TABLE ${tableNameWithSchema} ALTER COLUMN ${columnNamesAsStr} DROP NOT NULL;`
            );
          }
        }
        // rename constraint
        if (action.rename && node.oldName != null) {
          // NOT NULL does not have to be renamed
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

        if (action.add) {
          // make sure column names for constraint are set
          if (columnNamesAsStr != null) {
            thisSql.up.push(
              `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" PRIMARY KEY (${columnNamesAsStr});`
            );
          }
        } else if (action.remove) {
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
          );
        }

        // rename constraint
        if (action.rename && node.oldName != null) {

          thisSql.up.push(
            `ALTER INDEX "${schemaName}"."${node.oldName}" RENAME TO "${constraintName}";`
          );
        }
        break;
      case 'UNIQUE':
        if (action.add) {
          // make sure column names for constraint are set
          if (columnNamesAsStr != null) {
            thisSql.up.push(
              `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNamesAsStr});`
            );
          }
        } else if (action.remove) {
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
          );
        }

        // rename constraint
        if (action.rename && node.oldName != null) {

          thisSql.up.push(
            `ALTER INDEX "${schemaName}"."${node.oldName}" RENAME TO "${constraintName}";`
          );
        }
        break;
      case 'CHECK':

        if (action.add) {
          const checkExpression = node.options.param1;
          thisSql.up.push(
            `ALTER TABLE ${tableNameWithSchema} ADD CONSTRAINT "${constraintName}" CHECK (${checkExpression});`
          );
        } else if (action.remove) {
          thisSql.down.push(
            `ALTER TABLE ${tableNameWithSchema} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
          );
        }
        // rename constraint
        if (action.rename && node.oldName != null) {
          // check does not have to be renamed
        }
        break;
    }

  }

  function createRelation(sqlMigrationObj, relationName, relationObject: F1.IDbRelation[]) {
    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.relations[relationName] =
      sqlMigrationObj.relations[relationName] || _createEmptySqlObj(relationName);
    const thisSql = thisSqlObj.sql;

    // relation sides
    // iterate all sides of relation
    relationObject.forEach((thisRelation) => {
      _createSqlRelation(thisRelation);
    });
    function _createSqlRelation(oneRelation: F1.IDbRelation, ignoreColumnsCreation: boolean = false) {
      const { action, node } = _splitActionFromNode(oneRelation);

      // ignore the 'MANY' side
      if (node.type === 'ONE') {

        // CANNOT BE DONE FOR MIGRATIONS WHERE TABLES MIGHT BE MISSING
        // check if both sides of relation exist, ignore relation otherwise
        // todo redundant => combine into function
        /*
        // todo: remove, cannot be checked for relations. trust, DB will test!
        if (migrationDbObject.schemas[node.schemaName] == null ||
            migrationDbObject.schemas[node.schemaName].tables[node.tableName] == null) {
          process.stdout.write(
            'migration.relation.missing.table: ' +
            `${node.name}: ${node.schemaName}.${node.tableName} not found` + '\n'
          );
          return;
        } else if (migrationDbObject.schemas[node.reference.schemaName] == null ||
                   migrationDbObject.schemas[node.reference.schemaName].tables[node.reference.tableName] == null) {
          process.stdout.write(
            'migration.relation.missing.table: ' +
            `${node.name}: ${node.reference.schemaName}.${node.reference.tableName} not found` + '\n'
          );
          return;
        }*/

        const tableName = `"${node.schemaName}"."${node.tableName}"`;
        const fullRelationToNode = dbObjectTo.relations[node.name];

        // create column for FK // convention: uuid
        if (!ignoreColumnsCreation) {
          if (action.add) {
            // does not have to be extra created -> will be created IF NOT EXISTS with the realtion itself
          } else if (action.remove) { // in case of FK recration, no need to remove column (removeConstraintOnly = true)
            // drop or rename column
            if (!renameInsteadOfDrop) {
              thisSql.down.push(
                `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS "${node.columnName}" CASCADE;`
              );
            } else {
              thisSql.down.push(
                `ALTER TABLE ${tableName} RENAME COLUMN "${node.columnName}" TO "${DELETED_PREFIX}${node.columnName}";`
              );
            }
          }
        }

        // foreign key constraint
        const constraintName = `fk_${node.name}`;

        // change constraint description for add and rename / drop for remove
        if (action.add || action.rename) {

          // make sure foreign key columns is there
          thisSql.up.push(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS "${node.columnName}" uuid;`);
          // we need to drop a possible existing one, in order to update onUpdate and onDelete
          thisSql.up.push(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`);
          // and add a new version with all attributes
          let newFkConstraint = `ALTER TABLE ${tableName} ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${node.columnName}") ` +
            `REFERENCES "${node.reference.schemaName}"."${node.reference.tableName}"("${node.reference.columnName}")`;

          // check onUpdate and onDelete
          if (node.onDelete != null) {
            newFkConstraint += ` ON DELETE ${node.onDelete}`;
          }
          if (node.onUpdate != null) {
            newFkConstraint += ` ON UPDATE ${node.onUpdate}`;
          }
          newFkConstraint += ';';
          thisSql.up.push(newFkConstraint);
          thisSql.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS '${JSON.stringify(fullRelationToNode)}';`);

        } else if (action.remove) {

          thisSql.down.push(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`);
          // drop or rename column
          if (!renameInsteadOfDrop) {
            thisSql.down.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS NULL;`);
          }
        }
      } else {
        // for MANY => update ONE side of relation in case of a rename
        if (action.rename) {
          // foreign key constraint
          const constraintName = `fk_${node.name}`;

          const oneSideTableName = `"${node.reference.schemaName}"."${node.reference.tableName}"`;
          const fullRelationToNode = dbObjectTo.relations[node.name];
          thisSql.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${oneSideTableName} IS '${JSON.stringify(fullRelationToNode)}';`);
        }
      }

      // change relation? -> recreate
      if (action.change) {
        /*
        // FROM find one side and copy and add "remove" action
        const fullRelationFromNodeOneSide = { ...Object.values(dbObjectFrom.relations[node.name]).find((relation) => {
          return (relation.type === 'ONE');
        }), [ACTION_KEY]: {
          remove: true
        }};
        // remove old FK, keep column
        _createSqlRelation(fullRelationFromNodeOneSide, true);
        */
        // TO: find one side and copy and add "add" action
        const fullRelationToNodeOneSide = { ...Object.values(dbObjectTo.relations[node.name]).find((relation) => {
          return (relation.type === 'ONE');
        }), [ACTION_KEY]: {
          add: true
        }};
        // recreate new FK, keep column
        _createSqlRelation(fullRelationToNodeOneSide, true);

      }
    }

  }

  function createSqlManyToManyRelation(sqlMigrationObj, relationName, relationObject: F1.IDbRelation[]) {
    // create sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.relations[relationName] =
      sqlMigrationObj.schemas[relationName] || _createEmptySqlObj(relationName);
    const thisSql = thisSqlObj.sql;

    // relation sides
    const relation1 = _splitActionFromNode(relationObject[0]);
    const actionRelation1 = relation1.action;
    const nodeRelation1 = relation1.node;
    const nodeRelation1Clean = _removeFromEveryNode(nodeRelation1, ACTION_KEY);
    const relation2 = _splitActionFromNode(relationObject[1]);
    const actionRelation2 = relation2.action;
    const nodeRelation2 = relation2.node;
    const nodeRelation2Clean = _removeFromEveryNode(nodeRelation2, ACTION_KEY);

    /*
    // CANNOT BE DONE FOR MIGRATIONS WHERE TABLES MIGHT BE MISSING
    // check if both sides of relation exist, ignore relation otherwise
    // todo redundant => combine into function
    if (migrationDbObject.schemas[nodeRelation1Clean.schemaName] == null ||
      migrationDbObject.schemas[nodeRelation1Clean.schemaName].tables[nodeRelation1Clean.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation1Clean.name}: ${nodeRelation1Clean.schemaName}.${nodeRelation1Clean.tableName} not found` + '\n'
      );
      return;
    } else if (migrationDbObject.schemas[nodeRelation1Clean.reference.schemaName] == null ||
      migrationDbObject.schemas[nodeRelation1Clean.reference.schemaName].tables[nodeRelation1Clean.reference.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation1Clean.name}: ${nodeRelation1Clean.reference.schemaName}.${nodeRelation1Clean.reference.tableName} not found` + '\n'
      );
      return;
    }

    // check if both sides of relation exist, ignore relation otherwise
    // todo redundant => combine into function
    if (migrationDbObject.schemas[nodeRelation2Clean.schemaName] == null ||
      migrationDbObject.schemas[nodeRelation2Clean.schemaName].tables[nodeRelation2Clean.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation2Clean.name}: ${nodeRelation2Clean.schemaName}.${nodeRelation2Clean.tableName} not found` + '\n'
      );
      return;
    } else if (migrationDbObject.schemas[nodeRelation2Clean.reference.schemaName] == null ||
      migrationDbObject.schemas[nodeRelation2Clean.reference.schemaName].tables[nodeRelation2Clean.reference.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation2Clean.name}: ${nodeRelation2Clean.reference.schemaName}.${nodeRelation2Clean.reference.tableName} not found` + '\n'
      );
      return;
    }
*/
    // relation 1
    const tableName1 = `"${nodeRelation1.schemaName}"."${nodeRelation1.tableName}"`;
    if (actionRelation1.add) {
      // create fk column 1
      thisSql.up.push(
        `ALTER TABLE ${tableName1} ADD COLUMN "${nodeRelation1.columnName}" uuid[];`
      );

    } else if (actionRelation1.remove) {

      // drop or rename column
      if (!renameInsteadOfDrop) {
        // remove fk column 1
        thisSql.down.push(
          `ALTER TABLE ${tableName1} DROP COLUMN IF EXISTS "${nodeRelation1.columnName}" CASCADE;`
        );
        // remove meta information
        thisSql.down.push(`COMMENT ON COLUMN ${tableName1}."${nodeRelation1.columnName}" IS NULL;`);
      } else { // create rename instead
        thisSql.down.push(
          `ALTER TABLE ${tableName1} RENAME COLUMN "${nodeRelation1.columnName}" TO "${DELETED_PREFIX}${nodeRelation1.columnName}";`
        );
      }
    }
    // add relation description for add and rename
    if (actionRelation1.add || actionRelation1.rename) {
      // add comment with meta information
      thisSql.up.push(`COMMENT ON COLUMN ${tableName1}."${nodeRelation1.columnName}" IS '${JSON.stringify(nodeRelation1Clean)}';`);
    }

    // relation2
    const tableName2 = `"${nodeRelation2.schemaName}"."${nodeRelation2.tableName}"`;
    if (actionRelation2.add) {
      // create fk column 2
      thisSql.up.push(
        `ALTER TABLE ${tableName2} ADD COLUMN "${nodeRelation2.columnName}" uuid[];`
      );

    } else if (actionRelation2.remove) {
      // drop or rename column
      if (!renameInsteadOfDrop) {
        // remove fk column 2
        thisSql.down.push(
          `ALTER TABLE ${tableName2} DROP COLUMN IF EXISTS "${nodeRelation2.columnName}" CASCADE;`
        );

        // remove meta information
        thisSql.down.push(`COMMENT ON COLUMN ${tableName2}."${nodeRelation2.columnName}" IS NULL;`);
      } else { // create rename instead
        thisSql.down.push(
          `ALTER TABLE ${tableName2} RENAME COLUMN "${nodeRelation2.columnName}" TO "${DELETED_PREFIX}${nodeRelation2.columnName}";`
        );
      }
    }
    // add relation description for add and rename
    if (actionRelation2.add || actionRelation2.rename) {
      // add comment with meta information
      thisSql.up.push(`COMMENT ON COLUMN ${tableName2}."${nodeRelation2.columnName}" IS '${JSON.stringify(nodeRelation2Clean)}';`);
    }

    // todo create trigger to check consistency and cascading
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
          result[key] = (isObject(thisValue) && isObject(pBase[key])) ? changes(thisValue, pBase[key]) : thisValue;
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
  function _addToLastNode(obj: {}, addKey: string, addValue: any) {
    function nested(pObj) {
      return _.transform(pObj, (result, value, key) => {
        // check if object has children
        const hasChildren = (Object.values(pObj).find((thisVal) => {
          return isObject(thisVal);
        }) != null);
        // add to last node
        if (!hasChildren) {
          result[addKey] = addValue;
        }
        // recursion
        result[key] = (isObject(value)) ? nested(value) : value;
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
  function _addToEveryNode(obj: {}, addKey: string, addValue: any) {
    function nested(pObj) {
      return _.transform(pObj, (result, value, key) => {
        // add to very "object" node
        result[addKey] = addValue;
        // recursion
        result[key] = (isObject(value)) ? nested(value) : value;
      });
    }
    return nested(obj);
  }

  /**
   * Deep removal key from every node
   * @param  {Object} obj Object compared
   * @param  {string} removeKey  key that should be added
   * @return {Object}        Return a new object who represent the diff
   */
  function _removeFromEveryNode(obj: {}, removeKey: string) {
    function nested(pObj) {
      return _.transform(pObj, (result, value, key) => {
        // remove from every node
        if (value != null) {
          delete value[removeKey];
        }
        // recursion
        result[key] = (isObject(value)) ? nested(value) : value;
      });
    }
    return nested(obj);
  }

  /**
   * Deep removal of empty objects
   * @param  {Object} obj Object to be cleaned
   * @return {Object}        Return a new cleaned up object
   */
  function _cleanObject(obj: {}) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value === undefined) {
          delete obj[key];
        }

        if (typeof value === 'object' && !(value instanceof Date)) {
          _cleanObject(obj[key]);

          if (value === null) {
            continue;
          }

          if (!Array.isArray(value) && !Object.keys(value).length) {
            delete obj[key];
          }
        }
      }
    }

    return obj;
  }

  // returns simple object without nested objects
  function _getPropertiesWithoutNested(obj, propertiesToIgnore: string[] = []) {
    if (obj != null) {
      return Object.entries(obj).reduce((result, entry) => {
        const key = entry[0];
        const val = entry[1];
        if (!isObject(val) && propertiesToIgnore.indexOf(key) === -1) {
          result[key] = val;
        }
        return result;
      }, {});
    }
    return obj;
  }

  function _diffAndAddActions(dbObjFrom, dbObjTo) {

    return iterateAndMark(dbObjFrom, dbObjTo, {});
    function iterateAndMark(pDbObjFrom, pDbObjTo, pResult, pFromObjParent: {} = {}, pToObjParent: {} = {}, pResultParent: {} = {}) {
      // all keys
      const keys = _.union(Object.keys(pDbObjFrom), Object.keys(pDbObjTo));
      keys.map((key) => {
        if /* only from */ (pDbObjTo[key] == null) {
          // is not object -> copy value
          if (!isObject(pDbObjFrom[key])) {
            // ignore empty
            if (pDbObjFrom[key] != null) {
              pResult[key] = pDbObjFrom[key];
            }
          } else { // nested object
            // mark node as "remove" continue recursively
            pResult[key] = pResult[key] || {}; // create node if not available
            pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
            pResult[key][ACTION_KEY].remove = true;
            iterateAndMark(pDbObjFrom[key], {}, pResult[key], pDbObjFrom, pDbObjTo, pResult);
          }

        } /* only "to" */ else if (pDbObjFrom[key] == null) {
          // is not object -> copy value
          if (!isObject(pDbObjTo[key])) {
            // ignore empty
            if (pDbObjTo[key] != null) {
              // copy value
              pResult[key] = pDbObjTo[key];
            }
          } else { // nested object
            // mark node as "add" continue recursively
            pResult[key] = pResult[key] || {}; // create node if not available
            pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
            pResult[key][ACTION_KEY].add = true;
            iterateAndMark({}, pDbObjTo[key], pResult[key], pDbObjFrom, pDbObjTo, pResult);
          }

        } /* both sides */ else {
          // both not an object?
          if (!isObject(pDbObjFrom[key]) && !isObject(pDbObjTo[key])) {

            // not equal? -> use new value, mark parent as changed / otherwise ignore
            if (pDbObjFrom[key] !== pDbObjTo[key]) {
              pResult[key] = pDbObjTo[key];
              // parent "change"
              pResult[ACTION_KEY] = pResult[ACTION_KEY] || {};
              pResult[ACTION_KEY].change = true;
            } else {
              // ignore equal values, but keep name
              if (key === 'name') {
                pResult[key] = pDbObjTo[key];
              }
            }
          } else { // nested object

            // create empty node
            pResult[key] = pResult[key] || {};
            // compare old and new (first level) and mark as changed if not equal
            const nodeDiff = _difference(_getPropertiesWithoutNested(pDbObjTo[key], ['oldName', 'oldSchemaName']),
              _getPropertiesWithoutNested(pDbObjFrom[key], ['oldName', 'oldSchemaName']));
            if (Object.keys(nodeDiff).length > 0) {
              // "change" detected, mark this node before continuing recursively
              pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
              pResult[key][ACTION_KEY].change = true;
            }

            // continue recursively
            iterateAndMark(pDbObjFrom[key], pDbObjTo[key], pResult[key], pDbObjFrom, pDbObjTo, pResult);

          }

        }
      });

      // adjust changes to dbObj for migration
      _adjustDeltaDbObject(pResult);
      // clean empty objects
      _cleanObject(pResult);
      return pResult;
    }

  }

  function _adjustDeltaDbObject(pMigrationDbObject: F1.IDbObject): F1.IDbObject {

    // iterate schemas
    if (pMigrationDbObject.schemas != null) {
      Object.entries(pMigrationDbObject.schemas).map((schema) => {
        const schemaName = schema[0];
        const schemaDef = schema[1];

        // iterate tables
        if (schemaDef.tables != null) {
          Object.entries(schemaDef.tables).map((table) => {
            const tableName = table[0];
            const tableDef = table[1];

            // rename table?
            if (tableDef.oldName != null || tableDef.oldSchemaName != null) {
              _combineRenamedNodes(tableDef.oldSchemaName, tableDef.schemaName, tableDef.oldName, tableName, pMigrationDbObject.schemas);
            }

            // iterate columns
            if (tableDef.columns != null) {
              Object.entries(tableDef.columns).map((column) => {
                const columnName = column[0];
                const columnDef = column[1];

                // rename column?
                if (columnDef.oldName != null) {
                  _combineRenamedNodes(null, null, columnDef.oldName, columnName, tableDef.columns);
                }

              });
            }

          });
        }
      });
    }
    // iterate enums and adjust enums
    if (pMigrationDbObject.enums != null) {
      Object.entries(pMigrationDbObject.enums).map((enumEntry) => {
        const enumName = enumEntry[0];
        const enumDef = enumEntry[1];
        const enumValues = enumDef.values;
        const enumAction = enumDef[ACTION_KEY];
        const enumValuesAction = _splitActionFromNode(enumValues).action;

        // if enum or enum values action "change" => recreate (remove and add) enum type
        // override with enum values "to" and mark als remove and add
        if ((enumAction != null && enumAction.change) || (enumValuesAction != null && enumValuesAction.change)) {
          enumDef.values = dbObjectTo.enums[enumName].values;
          enumDef[ACTION_KEY] = {
            remove: true,
            add:    true
          };

          // mark columns as changed to force type cast to new enum type
          const enumColumns = _splitActionFromNode(enumDef.columns).node;
          Object.values(enumColumns).forEach((enumColumn) => {
            // access coulmn using enum
            const enumColumnDefinitionMigration =
              pMigrationDbObject.schemas[enumColumn.schemaName].tables[enumColumn.tableName].columns[enumColumn.columnName];
            const enumColumnDefinitionTo =
              dbObjectTo.schemas[enumColumn.schemaName].tables[enumColumn.tableName].columns[enumColumn.columnName];

            enumColumnDefinitionMigration[ACTION_KEY] = enumColumnDefinitionMigration[ACTION_KEY] || {};
            enumColumnDefinitionMigration[ACTION_KEY].changed = true;
            // keep needed type information from "to" state
            enumColumnDefinitionMigration.type        = enumColumnDefinitionTo.type;
            enumColumnDefinitionMigration.customType  = enumColumnDefinitionTo.customType;
          });
        }
      });
    }

    function _combineRenamedNodes(oldSchemaName, newSchemaName, oldName, newName, parent) {
      let nodeFrom;
      let nodeTo;
      let nextParentFrom;
      let nextParentTo;

      // schemaName => is a table
      if (newSchemaName != null) {
        const schemaNameFrom  = oldSchemaName || newSchemaName;
        const tableNameFrom   = oldName || newName;
        // only proceed if not renamed yet
        if (parent[schemaNameFrom] != null && parent[schemaNameFrom].tables[tableNameFrom]) {
          // find nodes in different schemas
          nodeFrom        = parent[schemaNameFrom].tables[tableNameFrom];
          nodeTo          = parent[newSchemaName].tables[newName];
          // get next parent for old and new (could be different schemas)
          nextParentFrom  = parent[schemaNameFrom].tables;
          nextParentTo    = parent[newSchemaName].tables;
        }
      } else { // not table (probably column)
        nodeFrom        = parent[oldName];
        nodeTo          = parent[newName];
        // for column both parents are equal (tables can be in different schemas)
        nextParentFrom  = parent;
        nextParentTo    = parent;
      }

      // does the original still exist
      if (nodeFrom == null && nodeTo != null) {
        // already renamed, remove oldName
        delete nodeTo.oldName;

      } else if (nodeTo != null && nodeFrom != null && nodeTo !== nodeFrom) {
        // => original still exists and both are not the same (e.g. oldName = name)

        // find differences (e.g. new columns), keep new and old name
        const renameObj = _difference(nodeTo, nodeFrom);
        // always keep node name
        renameObj.name = nodeTo.name;

        // overwrite action and set to 'rename'
        renameObj[ACTION_KEY] = {
          rename: true
        };

        // check if other changes were made besides a rename
        const otherChanges = _getPropertiesWithoutNested(renameObj, [ACTION_KEY, 'name', 'oldName', 'oldSchemaName']);
        if (Object.keys(otherChanges).length > 0) {
          // yes, mark as changed as well
          renameObj[ACTION_KEY].change = true;
        }

        renameObj.name = nodeTo.name;
        // oldName is not set for Schema migrations, use actual name instead
        renameObj.oldName = nodeTo.oldName || nodeTo.name;

        // remove old object that shall be renamed
        delete nextParentFrom[nodeFrom.name];

        // save merged as the new one
        nextParentTo[nodeTo.name] = renameObj;

        // check if node is a column and has constraints
        if (renameObj.constraintNames != null) {
          // todo not implemented yet, for now column constraints will be recreated on rename -> does not harm, maybe improve later
          // _renameColumnConstraints();
        }

        // check if node is a table and has constraints
        if (renameObj.constraints != null) {
          _renameTableConstraints();
        }

        // check if node is a table and has relations
        if (pMigrationDbObject.relations) {
          _renameRelations();
        }

        /**
         * Rename constraints (for tables)
         */
        function _renameTableConstraints() {
          const fromConstraints = nodeFrom.constraints;
          const toConstraints   = renameObj.constraints;

          // both sides of constraints set?
          if (fromConstraints != null && toConstraints != null) {
            // iterate from constraints
            const fromConstraintsNode = _splitActionFromNode(fromConstraints).node;
            Object.entries(fromConstraintsNode).map((fromConstraintEntry) => {
              const fromConstraintName            = fromConstraintEntry[0];
              // clean constraint definition
              const fromConstraintDefinition      = _splitActionFromNode(fromConstraintEntry[1]).node;
              const fromConstraintDefinitionClean = _removeFromEveryNode(fromConstraintDefinition, ACTION_KEY);

              // create to constraint name
              const toConstraintName            = fromConstraintName.replace(renameObj.oldName, renameObj.name);
              // clean constraint definition
              const toConstraintDefinition      = _splitActionFromNode(toConstraints[toConstraintName]).node;
              const toConstraintDefinitionClean = _removeFromEveryNode(toConstraintDefinition, ACTION_KEY);

              // rename if both constraints are similar
              if (deepEqual(toConstraintDefinitionClean, fromConstraintDefinitionClean)) {

                // create rename constraint
                toConstraints[toConstraintName] = {
                  [ACTION_KEY]: {
                    rename: true
                  },
                  oldName: fromConstraintName,
                  // different constraint have to be renamed differently
                  type: toConstraintDefinition.type
                };

                // delete old constraint
                delete fromConstraints[fromConstraintName];
              }
            });
          }
        }

        /**
         * Rename relations (for tables)
         */
        function _renameRelations() {
          const newTableName = renameObj.name;
          const newRelationSideName = `${newSchemaName}.${newTableName}`;

          const oldTableName = renameObj.oldName || newTableName; // could be only change of schema name
          const oldRelationSideName = `${oldSchemaName}.${oldTableName}`;

          // iterate relations
          const relationsToBeRenamed = Object.values(pMigrationDbObject.relations).filter((relationsObj) => {
            // iterate both sides of the relation
            let result = false;
            Object.values(relationsObj).map((sideOfRelation) => {
              // find relations for this table
              result = (
                (sideOfRelation.schemaName === newSchemaName || sideOfRelation.schemaName === oldSchemaName) &&
                (sideOfRelation.tableName === newTableName || sideOfRelation.tableName === oldTableName));
            });
            return result;
          });

          // iterate found relations
          Object.values(relationsToBeRenamed).map((relationObj) => {

            // shallow clone (so that we can remove the name for comparison
            const newRelation = { ... relationObj[newRelationSideName] };
            const oldRelation = { ... relationObj[oldRelationSideName] };

            // rename relation only, when both constraints are similar (without comparing table name)
            delete newRelation.tableName;
            delete oldRelation.tableName;
            if (!deepEqual(oldRelation, newRelation)) {
              // remove old part of relation
              delete pMigrationDbObject.relations[oldRelation.name][oldRelationSideName];
              // mark remaining two as to be renamed

              Object.values(relationObj).map((relationToTable) => {
                if (relationToTable.tableName != null) {
                  // mark
                  relationToTable[ACTION_KEY] = {
                    rename: true
                  };
                  // and return
                  pMigrationDbObject.relations[newRelation.name][newRelationSideName] = relationToTable;
                }
              });
            }
          });
        }
      }

    }

    /*function nested(pObj) {
      return _.transform(pObj, (result, value, key) => {

        // only the ones with children
        // (null is an object!)
        if (value != null && isObject(value)) {
          // filter my children with oldName
          for (const entry of Object.entries(value)) {
            const thisKey  = entry[0];
            const thisVal  = entry[1];

            // check that original still exists
            if (thisVal != null && thisVal.oldName != null && value[thisVal.oldName]) {

              // find the original one that should be renamed
              const toBeRenamedFrom = deepmerge(value[thisVal.oldName], {});
              const toBeRenamedTo   = deepmerge(thisVal, {});

              // find differences (e.g. new columns), keep new and old name
              const renameObj = deepmerge(toBeRenamedTo, toBeRenamedFrom);
              renameObj[ACTION_KEY] = {
                rename: true
              };

              renameObj.name = toBeRenamedTo.name;
              renameObj.oldName = toBeRenamedTo.oldName;
              value[thisKey] = renameObj;

              // remove old object that shall be renamed
              delete value[thisVal.oldName];

            } else if (thisVal != null) {
             // seems like it got renamed -> remove oldName
             delete thisVal.oldName;
            }
          }

          // remove all where action add and remove are both set
          if (value[ACTION_KEY] != null && value[ACTION_KEY].add === true && value[ACTION_KEY].remove === true) {
            delete value[ACTION_KEY];
          }

        }

        // recursion
        result[key] = (isObject(value)) ? nested(value) : value;

      });
    }
    return nested(obj);*/

    return pMigrationDbObject;
  }

}
