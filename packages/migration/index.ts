import * as _ from 'lodash';
import * as deepmerge from 'deepmerge';

import * as F1 from '../core';
import createViewsFromDbObject from './createViewsFromDbObject';
import { isExpressionValueUsed } from 'tsutils';

export namespace migration {
  const ACTION_KEY: string = '$$action$$';
  const DELETED_PREFIX: string = '_deleted:';
  let renameInsteadOfDrop: boolean = true;
  let dbObjectFrom: F1.IDbObject = null;
  let dbObjectTo: F1.IDbObject = null;
  let migrationDbObject: F1.IDbObject = null;

  export function createMigrationSqlFromTwoDbObjects(pDbObjectFrom: F1.IDbObject,
                                                     pDbObjectTo: F1.IDbObject,
                                                     pRenameInsteadOfDrop: boolean = true): string[] {

    renameInsteadOfDrop = pRenameInsteadOfDrop;

    // crete copy of objects
    // new
    dbObjectFrom = _.cloneDeep(pDbObjectFrom);
    // remove views and exposed names
    delete dbObjectFrom.exposedNames;

    // old
    dbObjectTo = _.cloneDeep(pDbObjectTo);
    // remove views and exposed names
    delete dbObjectTo.exposedNames;

    const deltaDbObjectRemove: any            = _removeEmptyObjects(_difference(dbObjectFrom, dbObjectTo));
    const deltaDbObjectRemoveWithActions: any = _addToEveryNode(deltaDbObjectRemove, ACTION_KEY, { remove: true });
    const deltaDbObjectAdd: any               = _removeEmptyObjects(_difference(dbObjectTo, dbObjectFrom));
    const deltaDbObjectAddWithAction: any     = _addToEveryNode(deltaDbObjectAdd, ACTION_KEY, { add: true });

    // use deepmerge instead of _.merge.
    // _.merge does some crazy shit -> confuses references
    migrationDbObject = _cleanUpDeltaDbObject(deepmerge(deltaDbObjectRemoveWithActions, deltaDbObjectAddWithAction));

    // remove graphql // todo
    delete migrationDbObject.schemas.graphql;

    // console.log(JSON.stringify(migrationDbObject, null, 2));
    // console.error('RENAME relations, rename schemas');
    return createSqlFromDeltaDbObject();
  }

  function _cleanUpDeltaDbObject(pMigrationDbObject: F1.IDbObject): F1.IDbObject {

    // iterate schemas

    if (pMigrationDbObject.schemas != null) {
      Object.entries(pMigrationDbObject.schemas).map((schema) => {
        const schemaName = schema[0];
        const schemaDef = schema[1];
        _cleanNodesMarkedAddAndRemove(schemaName, pMigrationDbObject.schemas);

        // iterate tables
        if (schemaDef.tables != null) {
          Object.entries(schemaDef.tables).map((table) => {
            const tableName = table[0];
            const tableDef = table[1];

            _cleanNodesMarkedAddAndRemove(tableName, schemaDef.tables);

            // rename table?
            if (tableDef.oldName != null) {
              _combineRenamedNodes(tableDef.oldName, tableName, schemaDef.tables);
            }

            // iterate columns
            if (tableDef.columns != null) {
              Object.entries(tableDef.columns).map((column) => {
                const columnName = column[0];
                const columnDef = column[1];
                _cleanNodesMarkedAddAndRemove(columnName, tableDef.columns);

                // rename column?
                if (columnDef.oldName != null) {
                  _combineRenamedNodes(columnDef.oldName, columnName, tableDef.columns);
                }

              });
            }

          });
        }
      });
     }

    function _combineRenamedNodes(oldName, newName, parent) {

      const nodeFrom  = parent[oldName];
      const nodeTo    = parent[newName];

      // check that original still exists and both are not the same (e.g. oldName = name)
      if (nodeTo != null && nodeFrom != null && nodeTo !== nodeFrom) {
        // find differences (e.g. new columns), keep new and old name
        const renameObj = _difference(nodeTo, nodeFrom);

        // overwrite action and set to 'rename'
        renameObj[ACTION_KEY] = {
          rename: true
        };

        renameObj.name = nodeTo.name;
        renameObj.oldName = nodeTo.oldName;

        // save merged as the new one
        parent[newName] = renameObj;
        // remove old object that shall be renamed
        delete parent[oldName];

        /**
         * Rename constraints (for tables)
         */
        // check if node (is a table and) has constraints
        if (renameObj.constraints != null) {
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
              if (JSON.stringify(toConstraintDefinitionClean) === JSON.stringify(fromConstraintDefinitionClean)) {

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
        if (pMigrationDbObject.relations) {
          const newTableName = nodeTo.name;
          const oldTableName = nodeTo.oldName;

          // iterate relations
          const relationForTable = {};
          Object.values(pMigrationDbObject.relations).map((relationsObj) => {
            // iterate both sides of the relation
            Object.values(relationsObj).map((sideOfRelation) => {
              // find relations for this table
              if (sideOfRelation.schemaName === nodeTo.schemaName &&
                (sideOfRelation.tableName === newTableName || sideOfRelation.tableName === oldTableName)) {
                relationForTable[sideOfRelation.name] = relationForTable[sideOfRelation.name] || {};
                relationForTable[sideOfRelation.name][sideOfRelation.tableName] = sideOfRelation;
              }
            });
          });

          // iterate found relations
          Object.values(relationForTable).map((relationObj) => {
            // shallow clone (so that we can remove the name for comparison
            const newRelation = { ... relationObj[nodeTo.name] };
            const oldRelation = { ... relationObj[nodeTo.oldName] };

            // rename relation if both constraints are similar (without comparing table name)
            delete newRelation.tableName;
            delete oldRelation.tableName;
            if (JSON.stringify(oldRelation) !== JSON.stringify(newRelation)) {
              const relationName = newRelation.name;
              // remove old part of relation
              delete pMigrationDbObject.relations[relationName][oldTableName];

              // replace new part of relation with rename object
              pMigrationDbObject.relations[relationName][newTableName] = {
                ...newRelation,
                tableName: newTableName, // restore table name
                [ACTION_KEY]: {
                  rename: true
                }
              };
            }
          });

        }
      }
    }

    function _cleanNodesMarkedAddAndRemove(nodeName, parent) {
      const node = parent[nodeName];
      // remove all where action add and remove are both set
      if (node[ACTION_KEY] != null && node[ACTION_KEY].add === true && node[ACTION_KEY].remove === true) {
        delete parent[nodeName][ACTION_KEY];
      }
    }

    /*function nested(pObj) {
      return _.transform(pObj, (result, value, key) => {

        // only the ones with children
        // (null is an object!)
        if (value != null && _.isObject(value)) {
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
        result[key] = (_.isObject(value)) ? nested(value) : value;

      });
    }
    return nested(obj);*/

    return pMigrationDbObject;
  }

  function _splitActionFromNode(node): {action: string, node: any} {

    const actionObj = (node != null) ? node[ACTION_KEY] : null;
    let action = null;

    if (actionObj == null) {
      action = null;
    } else if (actionObj.rename === true) {
      action = 'rename';
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

  function createSqlFromDeltaDbObject(): string[] {
    const sqlCommands = {
      up: [],
      down: []
    };

    // create enum types first
    if (migrationDbObject.enums != null) {
      Object.entries(migrationDbObject.enums).map((enumTypeArray) => {
        // ignore actions
        if (enumTypeArray[0] !== ACTION_KEY) {
          createSqlForEnumObject(sqlCommands, enumTypeArray[0], enumTypeArray[1]);
        }
      });
    }

    if (migrationDbObject.schemas != null) {
      const schemas = _splitActionFromNode(migrationDbObject.schemas).node;
      // iterate over database schemas
      Object.entries(schemas).map((schemaEntry) => {

        const schemaName = schemaEntry[0];
        const schemaDefinition = schemaEntry[1];

        createSqlFromSchemaObject(sqlCommands, schemaName, schemaDefinition);

        // iterate over database tables
        if (schemaDefinition != null && schemaDefinition.tables != null) {
          const tables = _splitActionFromNode(schemaDefinition.tables).node;
          Object.entries(tables).map((tableEntry) => {
            const tableName = tableEntry[0];
            const tableObject = tableEntry[1];
            createSqlFromTableObject(sqlCommands, schemaName, tableName, tableObject);
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
    const { action, node } = _splitActionFromNode(enumTypeValue);
    const enumValues = Object.values(node);

    if (action === 'add') {
      sqlCommands.up.push(`CREATE TYPE "${enumTypeName}" AS ENUM ('${enumValues.join('\',\'')}');`);
    } else if (action === 'remove') {
      sqlCommands.down.push(`DROP TYPE "${enumTypeName}";`);
    }
  }

  function createSqlFromSchemaObject(sqlCommands, schemaName: string, schemDefinition: any) {

    const { action, node } = _splitActionFromNode(schemDefinition);

    // avoid dropping or createing public schema
    if (schemaName !== 'public') {

      if (action === 'add') {
        // create schema statement
        sqlCommands.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
      } else if (action === 'remove') {
        // drop or rename schema
        if (!renameInsteadOfDrop) {
          sqlCommands.down.push(`DROP SCHEMA IF EXISTS "${schemaName}";`);
        } else { // create rename instead
          sqlCommands.down.push(`ALTER SCHEMA "${schemaName}" RENAME TO "${DELETED_PREFIX}${schemaName}";`);
        }
      }
    }

  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlCommands, schemaName, tableName, tableDefinition: any) {

    const { action, node } = _splitActionFromNode(tableDefinition);

    // use the current table name, otherwise name of node
    // (in case it got removed on dbObject merge)
    const tableNameUp   = node.name || tableName;
    const tableNameDown = (action === 'rename') ? node.oldName : tableNameUp;
    const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
    const tableNameWithSchemaDown = `"${schemaName}"."${tableNameDown}"`;

    // only if table needs to be created
    if (tableDefinition.name != null) {
      if (action === 'add') {

        // create table statement
        sqlCommands.up.push(`CREATE TABLE ${tableNameWithSchemaUp}();`);

      } else if (action === 'remove') {

        // create or rename table
        if (!renameInsteadOfDrop) {

          sqlCommands.down.push(`DROP TABLE IF EXISTS ${tableNameWithSchemaDown};`);
        } else { // create rename instead, ignore if already renamed

          if (tableDefinition.name.indexOf(DELETED_PREFIX) !== 0) {
            sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchemaDown} RENAME TO "${DELETED_PREFIX}${node.name}";`);
          } else {
            sqlCommands.down.push(`-- Table ${tableNameWithSchemaDown} was already renamed instead of deleted.`);
          }
        }
      } else if (action === 'rename') {
        sqlCommands.up.push(`ALTER TABLE "${schemaName}"."${node.oldName}" RENAME TO "${node.name}";`);
      }
    }

    // iterate columns
    if (tableDefinition.columns != null) {
      const columns = _splitActionFromNode(tableDefinition.columns).node;
      for (const columnObject of Object.entries(columns)) {
        const columnName = columnObject[0];
        const columnDefinition = columnObject[1];
        createSqlFromColumnObject(sqlCommands, schemaName, tableNameUp, tableNameDown, columnName, columnDefinition);
      }
    }

    // generate constraints for column
    if (tableDefinition.constraints != null) {
      const constraints = _splitActionFromNode(tableDefinition.constraints).node;
      for (const constraintObject of Object.entries(constraints)) {
        const constraintName = constraintObject[0];
        const constraintDefinition = constraintObject[1];
        createSqlFromConstraintObject(sqlCommands, schemaName, tableNameUp, tableNameDown, constraintName, constraintDefinition);
      }
    }

  }

  function createSqlFromColumnObject(sqlCommands, schemaName, tableNameUp, tableNameDown, columnName, columnObject: any) {
    const { action, node } = _splitActionFromNode(columnObject);

    const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
    const tableNameWithSchemaDown = `"${schemaName}"."${tableNameDown}"`;

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

      if (action === 'add' && node.name != null) {
        // create column statement
        sqlCommands.up.push(`ALTER TABLE ${tableNameWithSchemaUp} ADD COLUMN "${node.name}" varchar;`);
      } else if (action === 'remove') {

        // drop or rename
        if (!renameInsteadOfDrop) {
          sqlCommands.down.push(`ALTER TABLE ${tableNameWithSchemaDown} DROP COLUMN IF EXISTS "${node.name}" CASCADE;`);
        } else { // create rename instead
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchemaDown} RENAME COLUMN "${node.name}" TO "${DELETED_PREFIX}${node.name}";`
          );
        }
      } else if (action === 'rename' && node.oldName != null && node.name != null) {
        sqlCommands.up.push(
          `ALTER TABLE ${tableNameWithSchemaUp} RENAME COLUMN "${node.oldName}" TO "${node.name}";`
        );
      }

      // for every column that should not be removed
      if (action != null && action !== 'remove' && type != null && node.name != null) {
        // set or change column type
        sqlCommands.up.push(
          `ALTER TABLE ${tableNameWithSchemaUp} ALTER COLUMN "${columnName}" TYPE ${type} USING "${node.name}"::${type};`
        );
      }

    }

    // add default values
    if (node.defaultValue != null && node.defaultValue.value != null) {
      if (node.defaultValue.isExpression) {
        // set default - expression
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchemaUp} ALTER COLUMN "${columnName}" SET DEFAULT ${node.defaultValue.value};`
          );
        }  else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchemaDown} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      } else {
        // set default - value
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchemaUp} ALTER COLUMN "${columnName}" SET DEFAULT '${node.defaultValue.value}';`
          );
        }  else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchemaDown} ALTER COLUMN "${columnName}" DROP DEFAULT;`
          );
        }
      }
    }

  }

  function createSqlFromConstraintObject(sqlCommands, schemaName, tableNameUp, tableNameDown, constraintName, constraintObject) {
    const { action, node } = _splitActionFromNode(constraintObject);

    const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
    const tableNameWithSchemaDown = `"${schemaName}"."${tableNameDown}"`;

    const columnsObj = _splitActionFromNode(node.columns).node;
    const columnNamesAsStr = (node.columns != null) ?
      Object.values(columnsObj).map(columnName => `"${columnName}"`).join(',') : null;

    switch (node.type) {
      case 'not_null':
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchemaUp} ALTER COLUMN ${columnNamesAsStr} SET NOT NULL;`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchemaDown} ALTER COLUMN ${columnNamesAsStr} DROP NOT NULL;`
            );
          }
        }
        // rename constraint
        if (action === 'rename' && node.oldName != null) {
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

        // make sure column names for constraint are set
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchemaUp} ADD CONSTRAINT "${constraintName}" PRIMARY KEY (${columnNamesAsStr});`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchemaDown} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
            );
          }
        }

        // rename constraint
        if (action === 'rename' && node.oldName != null) {

          sqlCommands.up.push(
            `ALTER INDEX "${schemaName}"."${node.oldName}" RENAME TO "${constraintName}";`
          );
        }
        break;
      case 'UNIQUE':
        // make sure column names for constraint are set
        if (columnNamesAsStr != null) {
          if (action === 'add') {
            sqlCommands.up.push(
              `ALTER TABLE ${tableNameWithSchemaUp} ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNamesAsStr});`
            );
          } else if (action === 'remove') {
            sqlCommands.down.push(
              `ALTER TABLE ${tableNameWithSchemaDown} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
            );
          }
        }
        // rename constraint
        if (action === 'rename' && node.oldName != null) {

          sqlCommands.up.push(
            `ALTER INDEX "${schemaName}"."${node.oldName}" RENAME TO "${constraintName}";`
          );
        }
        break;
      case 'CHECK':
        const checkExpression = node.options.param1;
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableNameWithSchemaUp} ADD CONSTRAINT "${constraintName}" CHECK (${checkExpression});`
          );
        } else if (action === 'remove') {
          sqlCommands.down.push(
            `ALTER TABLE ${tableNameWithSchemaDown} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE;`
          );
        }
        // rename constraint
        if (action === 'rename' && node.oldName != null) {
          // check does not have to be renamed
        }
        break;
    }

  }

  function createRelation(sqlCommands, relationObject: F1.IDbRelation[]) {

    relationObject.map(createSqlRelation);
    function createSqlRelation(oneRelation: F1.IDbRelation) {

      const { action, node } = _splitActionFromNode(oneRelation);

      // ignore the 'MANY' side
      if (node.type === 'ONE') {

        // check if both sides of relation exist, ignore relation otherwise
        // todo redundant => combine into function
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
        }

        const tableName = `"${node.schemaName}"."${node.tableName}"`;

        // create column for FK // convention: uuid
        if (action === 'add') {
          sqlCommands.up.push(
            `ALTER TABLE ${tableName} ADD COLUMN "${node.columnName}" uuid;`
          );
        } else if (action === 'remove') {
          // drop or rename column
          if (!renameInsteadOfDrop) {
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
        const downConstraintStatement = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS "${constraintName}" CASCADE`;
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
          const nodeClean = _removeFromEveryNode(node, ACTION_KEY);
          sqlCommands.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS '${JSON.stringify(nodeClean)}';`);
        } else if (action === 'remove') {
          sqlCommands.down.push(
            downConstraintStatement + ';'
          );
          // drop or rename column
          if (!renameInsteadOfDrop) {
            sqlCommands.down.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${tableName} IS NULL;`);
          }
        }
      }
    }

  }

  function createSqlManyToManyRelation(sqlCommands, relationObject: F1.IDbRelation[]) {

    const relation1 = _splitActionFromNode(relationObject[0]);
    const actionRelation1 = relation1.action;
    const nodeRelation1 = relation1.node;
    const nodeRelation1Clean = _removeFromEveryNode(nodeRelation1, ACTION_KEY);
    const relation2 = _splitActionFromNode(relationObject[1]);
    const actionRelation2 = relation2.action;
    const nodeRelation2 = relation2.node;
    const nodeRelation2Clean = _removeFromEveryNode(nodeRelation2, ACTION_KEY);

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

    // relation 1
    const tableName1 = `"${nodeRelation1.schemaName}"."${nodeRelation1.tableName}"`;
    if (actionRelation1 === 'add') {
      // create fk column 1
      sqlCommands.up.push(
        `ALTER TABLE ${tableName1} ADD COLUMN "${nodeRelation1.columnName}" uuid[];`
      );

      // add comment with meta information
      sqlCommands.up.push(`COMMENT ON COLUMN ${tableName1}."${nodeRelation1.columnName}" IS '${JSON.stringify(nodeRelation1Clean)}';`);

    } else if (actionRelation1 === 'remove') {

      // drop or rename column
      if (!renameInsteadOfDrop) {
        // remove fk column 1
        sqlCommands.down.push(
          `ALTER TABLE ${tableName1} DROP COLUMN IF EXISTS "${nodeRelation1.columnName}" CASCADE;`
        );
        // remove meta information
        sqlCommands.down.push(`COMMENT ON COLUMN ${tableName1}."${nodeRelation1.columnName}" IS NULL;`);
      } else { // create rename instead
        sqlCommands.down.push(
          `ALTER TABLE ${tableName1} RENAME COLUMN "${nodeRelation1.columnName}" TO "${DELETED_PREFIX}${nodeRelation1.columnName}";`
        );
      }

    }

    // relation2
    const tableName2 = `"${nodeRelation2.schemaName}"."${nodeRelation2.tableName}"`;
    if (actionRelation2 === 'add') {
      // create fk column 2
      sqlCommands.up.push(
        `ALTER TABLE ${tableName2} ADD COLUMN "${nodeRelation2.columnName}" uuid[];`
      );

      // add comment with meta information
      sqlCommands.up.push(`COMMENT ON COLUMN ${tableName2}."${nodeRelation2.columnName}" IS '${JSON.stringify(nodeRelation2Clean)}';`);

    } else if (actionRelation2 === 'remove') {
      // drop or rename column
      if (!renameInsteadOfDrop) {
        // remove fk column 2
        sqlCommands.down.push(
          `ALTER TABLE ${tableName2} DROP COLUMN IF EXISTS "${nodeRelation2.columnName}" CASCADE;`
        );

        // remove meta information
        sqlCommands.down.push(`COMMENT ON COLUMN ${tableName2}."${nodeRelation2.columnName}" IS NULL;`);
      } else { // create rename instead
        sqlCommands.down.push(
          `ALTER TABLE ${tableName2} RENAME COLUMN "${nodeRelation2.columnName}" TO "${DELETED_PREFIX}${nodeRelation2.columnName}";`
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
function _addToLastNode(obj: {}, addKey: string, addValue: any) {
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
function _addToEveryNode(obj: {}, addKey: string, addValue: any) {
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
