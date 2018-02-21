
import * as helper from './helper';
import { IMigrationSqlObj, IAction } from './IMigrationSqlObj';
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { IDbMeta, IDbRelation } from '@fullstack-one/db';

export namespace sqlObjFromMigrationObject {

  const ACTION_KEY: string = '$$action$$';
  const DELETED_PREFIX: string = '_deleted:';
  const schemasToIgnore: any = ['_versions', 'graphql'];
  let renameInsteadOfDrop: boolean = true;
  let migrationObj: IDbMeta = null;
  let toDbMeta: IDbMeta = null;

  export function getSqlFromMigrationObj(pMigrationObj: IDbMeta, pToDbMeta: IDbMeta, pRenameInsteadOfDrop: boolean = true): string[] {

    renameInsteadOfDrop = pRenameInsteadOfDrop;

    // check if pMigrationObj is empty -> Parsing error
    if (pMigrationObj == null || Object.keys(pMigrationObj).length === 0) {
      throw new Error(`Migration Error: Provided migration object state is empty.`);
    }

    migrationObj = pMigrationObj;

    // save final state for comparison
    toDbMeta = pToDbMeta;

    return _sqlMigrationObjToSqlStatements(createSqlObjFromMigrationDbMeta());
  }

  function _splitActionFromNode(node: {} = {}): {action: IAction, node: any} {
    return helper.splitActionFromNode(ACTION_KEY, node);
  }

  // iterate sqlMigrationObj in a certain order in order to create SQL statement in the correct order
  function _sqlMigrationObjToSqlStatements(sqlMigrationObj: IMigrationSqlObj): string[] {
    const sqlStatements = [];

    // getSqlFromMigrationObj, drop and recreate enums
    if (sqlMigrationObj.enums != null) {
      Object.values(sqlMigrationObj.enums).forEach((enumSqlObj) => {
        // add down statements first (enum change or rename)
        _addStatemensArrayToSqlStatements(enumSqlObj.sql.down);
        // add up statements
        _addStatemensArrayToSqlStatements(enumSqlObj.sql.up);
      });
    }

    // getSqlFromMigrationObj tables
    if (sqlMigrationObj.schemas != null) {
      Object.values(sqlMigrationObj.schemas).forEach((schemaSqlObj) => {
        // no need to getSqlFromMigrationObj schemas, they will be generated with tables
        // getSqlFromMigrationObj tables
        if (schemaSqlObj.tables != null) {
          Object.values(schemaSqlObj.tables).forEach((tableSqlObj) => {
            // add table up statements
            _addStatemensArrayToSqlStatements(tableSqlObj.sql.up);

            // drop relations
            if (sqlMigrationObj.relations != null) {
              Object.values(sqlMigrationObj.relations).forEach((relationSqlObj) => {
                // add drop statements
                _addStatemensArrayToSqlStatements(relationSqlObj.sql.down);
              });
            }

            // drop constraints
            if (tableSqlObj.constraints != null) {
              // add down statements reversed order
              _addStatemensArrayToSqlStatements(tableSqlObj.constraints.sql.down.reverse());
            }

            // getSqlFromMigrationObj columns
            if (tableSqlObj.columns != null) {
              Object.values(tableSqlObj.columns).forEach((columnSqlObj) => {
                // add up statements
                _addStatemensArrayToSqlStatements(columnSqlObj.sql.up);
                // add down statements reversed order
                _addStatemensArrayToSqlStatements(columnSqlObj.sql.down.reverse());
              });
            }

            // getSqlFromMigrationObj constraints
            if (tableSqlObj.constraints != null) {
              // add up statements
              _addStatemensArrayToSqlStatements(tableSqlObj.constraints.sql.up);
            }

            // add table down statements
            _addStatemensArrayToSqlStatements(tableSqlObj.sql.down);

          });
        }
      });
    }

    // getSqlFromMigrationObj relations
    if (sqlMigrationObj.relations != null) {
      Object.values(sqlMigrationObj.relations).forEach((relationSqlObj) => {
        // add up statements
        _addStatemensArrayToSqlStatements(relationSqlObj.sql.up);
      });
    }

    // drop schemas
    if (sqlMigrationObj.schemas != null) {
      Object.values(sqlMigrationObj.schemas).forEach((schemasSqlObj) => {
        // add down statements
        _addStatemensArrayToSqlStatements(schemasSqlObj.sql.down);
      });
    }

    // set auth data
    if (sqlMigrationObj.auth != null && sqlMigrationObj.auth.sql != null) {
      // add down statements
      _addStatemensArrayToSqlStatements(sqlMigrationObj.auth.sql.down);
      // add up statements
      _addStatemensArrayToSqlStatements(sqlMigrationObj.auth.sql.up);

    }

    // helper to put collect unique statements
    function _addStatemensArrayToSqlStatements(statementsArray) {
      Object.values(statementsArray).forEach((statement) => {
        // only push each ones
        if (sqlStatements.indexOf(statement) === -1) {
          sqlStatements.push(statement);
        }
      });
    }

    return sqlStatements;
  }

  function createSqlObjFromMigrationDbMeta(): IMigrationSqlObj {
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

    // getSqlFromMigrationObj enum types first
    if (migrationObj.enums != null) {
      const enums = _splitActionFromNode(migrationObj.enums).node;
      Object.entries(enums).map((enumTypeArray) => {
        createSqlForEnumObject(sqlMigrationObj, enumTypeArray[0], enumTypeArray[1]);
      });
    }

    if (migrationObj.schemas != null) {
      const schemas = _splitActionFromNode(migrationObj.schemas).node;

      // iterate over database schemas
      Object.entries(schemas).map((schemaEntry) => {

        const schemaName = schemaEntry[0];
        const schemaDefinition: any = schemaEntry[1];

        // avoid dropping or creating mandatory schemas (and tables)
        if (!schemasToIgnore.includes(schemaName)) {
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
        }
      });
    }

    // iterate over database relations
    if (migrationObj.relations != null) {
      const relations = _splitActionFromNode(migrationObj.relations).node;

      Object.values(relations).map((
        relationObj: { [tableName: string]: IDbRelation }
      ) => {
        const relationDefinition: IDbRelation[] = Object.values(_splitActionFromNode(relationObj).node);

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

          // getSqlFromMigrationObj one:many / one:one relation
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

    // getSqlFromMigrationObj sql object if it doesn't exist
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

    // getSqlFromMigrationObj sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.schemas[schemaName] =
      sqlMigrationObj.schemas[schemaName] || _createEmptySqlObj(schemaName);
    // add tables to schema
    thisSqlObj.tables = thisSqlObj.tables  || {};
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(schemDefinition);

    if (action.add) {
      // don't getSqlFromMigrationObj schema, it will be created automatically with table creation
      // thisSql.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    } else if (action.remove) {
      // drop or rename schema
      if (!renameInsteadOfDrop) {
        thisSql.down.push(`DROP SCHEMA IF EXISTS "${schemaName}";`);
      } else { // getSqlFromMigrationObj rename instead
        thisSql.down.push(`ALTER SCHEMA "${schemaName}" RENAME TO "${DELETED_PREFIX}${schemaName}";`);
      }
    }

  }

  // http://www.postgresqltutorial.com/postgresql-alter-table/
  function createSqlFromTableObject(sqlMigrationObj, schemaName, tableName, tableDefinition: any) {

    // getSqlFromMigrationObj sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.schemas[schemaName].tables[tableName] =
      sqlMigrationObj.schemas[schemaName].tables[tableName] || _createEmptySqlObj(tableName);
    // add columns to table
    thisSqlObj.columns = thisSqlObj.columns  || {};
    const thisSql = thisSqlObj.sql;

    // node
    const { action, node } = _splitActionFromNode(tableDefinition);

    // use the current table name, otherwise name of node
    // (in case it got removed on dbMeta merge)
    const tableNameUp   = node.name || tableName;
    const tableNameDown = (action.rename) ? node.oldName : tableNameUp;
    const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
    const tableNameWithSchemaDown = `"${schemaName}"."${tableNameDown}"`;

    // only if table needs to be created
    if (tableDefinition.name != null) {
      if (action.add) {

        // getSqlFromMigrationObj table statement
        thisSql.up.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
        thisSql.up.push(`CREATE TABLE IF NOT EXISTS ${tableNameWithSchemaUp}();`);

      } else if (action.remove) {

        // getSqlFromMigrationObj or rename table
        if (!renameInsteadOfDrop) {

          thisSql.down.push(`DROP TABLE IF EXISTS ${tableNameWithSchemaDown};`);
        } else { // getSqlFromMigrationObj rename instead, ignore if already renamed

          if (tableDefinition.name.indexOf(DELETED_PREFIX) !== 0) {
            thisSql.down.push(`ALTER TABLE ${tableNameWithSchemaDown} RENAME TO "${DELETED_PREFIX}${node.name}";`);
          } else {
            // table was already renamed instead of deleted
          }
        }
      } else if (action.rename) {

        // move to other schema in down, so that it happens BEFORE old schema gets removed and table gets renamed
        if (node.oldSchemaName != null && node.schemaName != null && node.oldSchemaName !== node.schemaName) {
          // getSqlFromMigrationObj schema first if not available yet
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

    // versioning for table
    if (tableDefinition.versioning != null) {
      createVersioningForTable(thisSql, schemaName, tableNameUp, tableDefinition.versioning);
    }

    // immutability for table
    if (tableDefinition.immutable != null) {
      makeTableImmutable(thisSql, schemaName, tableNameUp, tableDefinition.immutable);
    }

  }

  function createSqlFromColumnObject(sqlMigrationObj, schemaName, tableName, columnName, columnObject: any) {

    // getSqlFromMigrationObj sql object if it doesn't exist
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
        // getSqlFromMigrationObj column statement
        thisSql.up.push(`ALTER TABLE ${tableNameWithSchema} ADD COLUMN "${node.name}" varchar;`);
      } else if (action.remove) {

        // drop or rename
        if (!renameInsteadOfDrop) {
          thisSql.down.push(`ALTER TABLE ${tableNameWithSchema} DROP COLUMN IF EXISTS "${node.name}" CASCADE;`);
        } else { // getSqlFromMigrationObj rename instead
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

    // set auth settings
    if (node.auth != null) {
      setAuthSettingsSql(sqlMigrationObj, schemaName, tableName, columnName, node.auth);
    }

  }

  function createSqlFromConstraintObject(sqlMigrationObj, schemaName, tableName, constraintName, constraintObject) {

    // getSqlFromMigrationObj sql object if it doesn't exist
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
        /* moved to graphQlSchemaToDbMeta -> expression
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

  function setAuthSettingsSql(sqlMigrationObj, schemaName, tableName, columnName?, authNode?) {
    // create, set ref and keek ref for later
    const thisSqlObj = (sqlMigrationObj.auth = sqlMigrationObj.auth || {
      sql: {
        up: [],
        down: []
      }
    }).sql;

    const authNodeObj = _splitActionFromNode(authNode);
    const authNodeAction = authNodeObj.action;
    const authNodeDefinition = authNodeObj.node;

    // in case of a change, multiple can happen at the same time -> no else if/switch
    // set username and table information
    if (authNodeDefinition.isUsername) {
      if (authNodeAction.remove) {
        // down
        thisSqlObj.down.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table_schema', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
        thisSqlObj.down.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
        thisSqlObj.down.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_username', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
      } else {
        // up
        thisSqlObj.up.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table_schema', '${schemaName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${schemaName}';`);
        thisSqlObj.up.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table', '${tableName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${tableName}';`);
        thisSqlObj.up.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_username', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`);
      }
    }

    // password
    if (authNodeDefinition.isPassword) {
      if (authNodeAction.remove) {
        thisSqlObj.down.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_password', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
      } else {
        thisSqlObj.up.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_password', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`);
      }
    }

    // tenant
    if (authNodeDefinition.isTenant) {
      if (authNodeAction.remove) {
        thisSqlObj.down.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_tenant', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
      } else {
        thisSqlObj.up.push(
          `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_tenant', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`);
      }
    }

  }

  function createVersioningForTable(tableSql, schemaName, tableName, versioningObjectWithAction) {

    const tableNameWithSchemaUp   = `"${schemaName}"."${tableName}"`;
    const versionTableNameWithSchemaUp   = `_versions."${schemaName}_${tableName}"`;

    // create
    const versioningActionObject = _splitActionFromNode(versioningObjectWithAction);
    const versioningAction = versioningActionObject.action;
    const versioningDef = versioningActionObject.node;

    // drop trigger for remove and before add (in case it's already there)
    if (versioningAction.remove || versioningAction.add) {
      // drop trigger, keep table and data
      tableSql.up.push(`DROP TRIGGER IF EXISTS "create_version_${schemaName}_${tableName}" ON ${tableNameWithSchemaUp} CASCADE;`);
    }

    // create versioning table and trigger
    if (versioningAction.add) {

      // (re-)create versioning table if not exists
      tableSql.up.push(`CREATE SCHEMA IF NOT EXISTS "_versions";`);
      tableSql.up.push(`CREATE TABLE IF NOT EXISTS ${versionTableNameWithSchemaUp}
          (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            created_at timestamp without time zone DEFAULT now(),
            user_id uuid,
            created_by character varying(255),
            action _meta.versioning_action,
            table_name character varying(255),
            table_id uuid,
            state jsonb,
            diff jsonb,
            CONSTRAINT _version_pkey PRIMARY KEY (id)
        );`);

      // create trigger for table
      tableSql.up.push(`CREATE TRIGGER "create_version_${schemaName}_${tableName}"
          AFTER INSERT OR UPDATE OR DELETE
          ON ${tableNameWithSchemaUp}
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.create_version();`);
    }
  }

  function makeTableImmutable(tableSql, schemaName, tableName, immutableObjectWithAction) {

    const tableNameWithSchemaUp   = `"${schemaName}"."${tableName}"`;

    // create
    const immutabilityActionObject  = _splitActionFromNode(immutableObjectWithAction);
    const immutabilityAction        = immutabilityActionObject.action;
    const immutabilityDef           = immutabilityActionObject.node;

    // drop trigger for remove and before add (in case it's already there)
    if (immutabilityAction.remove || immutabilityAction.add || immutabilityAction.change) {
      // drop trigger, keep table and data
      tableSql.up.push(`DROP TRIGGER IF EXISTS "table_is_not_updatable_${schemaName}_${tableName}" ON ${tableNameWithSchemaUp} CASCADE;`);
      tableSql.up.push(`DROP TRIGGER IF EXISTS "table_is_not_deletable_${schemaName}_${tableName}" ON ${tableNameWithSchemaUp} CASCADE;`);
    }

    // create versioning table and trigger
    if (immutabilityAction.add || immutabilityAction.change) {

      // create trigger for table: not updatable
      if (immutabilityDef.isUpdatable === false) { // has to be set EXACTLY to false
        tableSql.up.push(`CREATE TRIGGER "table_is_not_updatable_${schemaName}_${tableName}"
          BEFORE UPDATE
          ON ${tableNameWithSchemaUp}
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.make_table_immutable();`);
      }

      // create trigger for table: not updatable
      if (immutabilityDef.isDeletable === false) { // has to be set EXACTLY to false
        tableSql.up.push(`CREATE TRIGGER "table_is_not_deletable_${schemaName}_${tableName}"
          BEFORE DELETE
          ON ${tableNameWithSchemaUp}
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.make_table_immutable();`);
      }
    }
  }

  function createRelation(sqlMigrationObj, relationName, relationObject: IDbRelation[]) {
    // getSqlFromMigrationObj sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.relations[relationName] =
      sqlMigrationObj.relations[relationName] || _createEmptySqlObj(relationName);
    const thisSql = thisSqlObj.sql;

    // relation sides
    // iterate all sides of relation
    relationObject.forEach((thisRelation) => {
      _createSqlRelation(thisRelation);
    });
    function _createSqlRelation(oneRelation: IDbRelation, ignoreColumnsCreation: boolean = false) {
      const { action, node } = _splitActionFromNode(oneRelation);

      // ignore the 'MANY' side
      if (node.type === 'ONE') {

        // CANNOT BE DONE FOR MIGRATIONS WHERE TABLES MIGHT BE MISSING
        // check if both sides of relation exist, ignore relation otherwise
        // todo redundant => combine into function
        /*
        // todo: remove, cannot be checked for relations. trust, DB will test!
        if (sqlMigrationObj.schemas[node.schemaName] == null ||
            sqlMigrationObj.schemas[node.schemaName].tables[node.tableName] == null) {
          process.stdout.write(
            'migration.relation.missing.table: ' +
            `${node.name}: ${node.schemaName}.${node.tableName} not found` + '\n'
          );
          return;
        } else if (sqlMigrationObj.schemas[node.reference.schemaName] == null ||
                   sqlMigrationObj.schemas[node.reference.schemaName].tables[node.reference.tableName] == null) {
          process.stdout.write(
            'migration.relation.missing.table: ' +
            `${node.name}: ${node.reference.schemaName}.${node.reference.tableName} not found` + '\n'
          );
          return;
        }*/

        const tableName = `"${node.schemaName}"."${node.tableName}"`;
        const fullRelationToNode = toDbMeta.relations[node.name];

        // getSqlFromMigrationObj column for FK // convention: uuid
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
          const fullRelationToNode = toDbMeta.relations[node.name];
          thisSql.up.push(`COMMENT ON CONSTRAINT "${constraintName}" ON ${oneSideTableName} IS '${JSON.stringify(fullRelationToNode)}';`);
        }
      }

      // change relation? -> recreate
      if (action.change) {
        /*
        // FROM find one side and copy and add "remove" action
        const fullRelationFromNodeOneSide = { ...Object.values(fromDbMeta.relations[node.name]).find((relation) => {
          return (relation.type === 'ONE');
        }), [ACTION_KEY]: {
          remove: true
        }};
        // remove old FK, keep column
        _createSqlRelation(fullRelationFromNodeOneSide, true);
        */
        // TO: find one side and copy and add "add" action
        const fullRelationToNodeOneSide = { ...Object.values(toDbMeta.relations[node.name]).find((relation: any) => {
          return (relation.type === 'ONE');
        }), [ACTION_KEY]: {
          add: true
        }};
        // recreate new FK, keep column
        _createSqlRelation(fullRelationToNodeOneSide, true);

      }
    }

  }

  function createSqlManyToManyRelation(sqlMigrationObj, relationName, relationObject: IDbRelation[]) {
    // getSqlFromMigrationObj sql object if it doesn't exist
    const thisSqlObj = sqlMigrationObj.relations[relationName] =
      sqlMigrationObj.schemas[relationName] || _createEmptySqlObj(relationName);
    const thisSql = thisSqlObj.sql;

    // relation sides
    const relation1 = _splitActionFromNode(relationObject[0]);
    const actionRelation1 = relation1.action;
    const nodeRelation1 = relation1.node;
    const nodeRelation1Clean = helper.removeFromEveryNode(nodeRelation1, ACTION_KEY);
    const relation2 = _splitActionFromNode(relationObject[1]);
    const actionRelation2 = relation2.action;
    const nodeRelation2 = relation2.node;
    const nodeRelation2Clean = helper.removeFromEveryNode(nodeRelation2, ACTION_KEY);

    /*
    // CANNOT BE DONE FOR MIGRATIONS WHERE TABLES MIGHT BE MISSING
    // check if both sides of relation exist, ignore relation otherwise
    // todo redundant => combine into function
    if (sqlMigrationObj.schemas[nodeRelation1Clean.schemaName] == null ||
      sqlMigrationObj.schemas[nodeRelation1Clean.schemaName].tables[nodeRelation1Clean.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation1Clean.name}: ${nodeRelation1Clean.schemaName}.${nodeRelation1Clean.tableName} not found` + '\n'
      );
      return;
    } else if (sqlMigrationObj.schemas[nodeRelation1Clean.reference.schemaName] == null ||
      sqlMigrationObj.schemas[nodeRelation1Clean.reference.schemaName].tables[nodeRelation1Clean.reference.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation1Clean.name}: ${nodeRelation1Clean.reference.schemaName}.${nodeRelation1Clean.reference.tableName} not found` + '\n'
      );
      return;
    }

    // check if both sides of relation exist, ignore relation otherwise
    // todo redundant => combine into function
    if (sqlMigrationObj.schemas[nodeRelation2Clean.schemaName] == null ||
      sqlMigrationObj.schemas[nodeRelation2Clean.schemaName].tables[nodeRelation2Clean.tableName] == null) {
      process.stdout.write(
        'migration.relation.missing.table: ' +
        `${nodeRelation2Clean.name}: ${nodeRelation2Clean.schemaName}.${nodeRelation2Clean.tableName} not found` + '\n'
      );
      return;
    } else if (sqlMigrationObj.schemas[nodeRelation2Clean.reference.schemaName] == null ||
      sqlMigrationObj.schemas[nodeRelation2Clean.reference.schemaName].tables[nodeRelation2Clean.reference.tableName] == null) {
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
      // getSqlFromMigrationObj fk column 1
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
      } else { // getSqlFromMigrationObj rename instead
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
      // getSqlFromMigrationObj fk column 2
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
      } else { // getSqlFromMigrationObj rename instead
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

    // todo getSqlFromMigrationObj trigger to check consistency and cascading
  }

}
