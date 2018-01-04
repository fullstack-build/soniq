// https://www.alberton.info/postgresql_meta_info.html
import { IDbObject, IDbRelation } from '../core/IDbObject';

const DELETED_PREFIX = '_deleted:';

export async function pgToDbObject($one): Promise<IDbObject> {
  const dbObject: IDbObject = {
    schemas: {},
    enums: {},
    relations: {}
  };

  try {
    const dbClient = $one.getDbSetupClient();

    await iterateAndAddSchemas(dbClient, dbObject);

    return { ...dbObject };
  } catch (err) {
    throw err;
  }

  // return copy instead of ref
}

async function iterateAndAddSchemas(dbClient, dbObject): Promise<void> {

  try {
    const dbTables = await dbClient.query(
      `SELECT
          schema_name
        FROM
          information_schema.schemata
        WHERE
            schema_name <> '_meta'
          AND
            schema_name <> 'information_schema'
          AND
          schema_name NOT LIKE 'pg_%';`
    );
    // iterate all tables
    for (const row of Object.values(dbTables.rows)) {
      const schemaName = row.schema_name;

      // ignore deleted schemas
      if (schemaName.indexOf(DELETED_PREFIX) !== 0) {
        // create schema objects for each schema
        dbObject.schemas[schemaName] = {
          tables:{},
          views: []
        };

        // iterate enum types
        await iterateEnumTypes(dbClient, dbObject, schemaName);
        // iterate tables
        await iterateAndAddTables(dbClient, dbObject, schemaName);
      }
    }

  } catch (err) {
    throw err;
  }

}

async function iterateEnumTypes(dbClient, dbObject, schemaName): Promise<void> {
  // iterate ENUM Types
  const dbEnums =  await dbClient.query(
    `SELECT
      n.nspname as enum_schema,
      t.typname as enum_name,
      array_to_json(array_agg(e.enumlabel)) as enum_values
    FROM
      pg_type t
    JOIN
      pg_enum e on t.oid = e.enumtypid
    JOIN
      pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE
      n.nspname = '${schemaName}'
    GROUP BY
      n.nspname, t.typname;`);

  // iterate all tables
  for (const row of Object.values(dbEnums.rows)) {
    const enumName = row.enum_name;
    dbObject.enums[enumName] = row.enum_values;
  }
}

async function iterateAndAddTables(dbClient, dbObject, schemaName): Promise<void> {

  try {
    const dbTables = await dbClient.query(
      `SELECT
            table_name
        FROM
          information_schema.tables
        WHERE
          table_schema ='${schemaName}' AND table_type='BASE TABLE';`
    );
    // iterate all tables
    for (const row of Object.values(dbTables.rows)) {
      const tableName = row.table_name;

      // create new table object
      dbObject.schemas[schemaName].tables[tableName] = {
        name: tableName,
        schemaName,
        description: null,
        constraints: {},
        columns: {}
      };

    }

    // iterate tables and add columns - relates on tables existing
    for (const tableName of Object.keys(dbObject.schemas[schemaName].tables)) {
      // add columns to table
      await iterateAndAddColumns(dbClient, dbObject, schemaName, tableName);
    }

    // iterate tables and add constraints - relates on tables and columns existing
    for (const tableName of Object.keys(dbObject.schemas[schemaName].tables)) {
      // add constraints to table
      await iterateAndAddConstraints(dbClient, dbObject, schemaName, tableName);
    }

  } catch (err) {
    throw err;
  }

}

async function iterateAndAddColumns(dbClient, dbObject, schemaName, tableName): Promise<void> {

  // keep reference to current table
  const currentTable = dbObject.schemas[schemaName].tables[tableName];

  try {

    const dbColumns = await dbClient.query(
      `SELECT
        c.column_name AS column_name,
        c.column_default AS column_default,
        c.is_nullable AS is_nullable,
        c.data_type AS data_type,
        c.udt_name AS udt_name,
        c.character_maximum_length AS character_maximum_length,
        pgd.description AS comment
      FROM
        information_schema.columns c
      LEFT JOIN
	      pg_catalog.pg_description pgd
	    ON
	      pgd.objsubid = c.ordinal_position
      WHERE
        table_schema = '${schemaName}'
        AND
        table_name = '${tableName}'
      ORDER BY
        ordinal_position ASC;`
    );

    // iterate all columns
    for (const column of Object.values(dbColumns.rows)) {
      const type = column.udt_name;

      // create new column and keep reference for later
      const columnName = column.column_name;
      const newColumn: any = {
        name: columnName,
        description: null,
        type
      };

      // add new column to dbObject if its not marked as deleted
      if (columnName.indexOf(DELETED_PREFIX) !== 0) {
        currentTable.columns[columnName] = newColumn;
      } else {
        continue;
      }

      // defaut value
      if (column.column_default !== null) {
        const isExpression = (column.column_default.indexOf('::') === -1);
        const value = (isExpression) ? column.column_default : column.column_default.split('::')[0].replace(/'/g,'');
        newColumn.defaultValue = {
          isExpression,
          value
        };
      }

      // add NOT NULLABLE constraint
      if (column.is_nullable === 'NO') {
        addConstraint('not_null',
                      { column_name: column.column_name },
                      currentTable);
      }

      // custom type
      if (column.data_type === 'USER-DEFINED') {
        newColumn.customType = type;
        // check if it is a known enum
        newColumn.type = (dbObject.enums[newColumn.customType] != null) ? 'enum' : 'customType';
      } else if (column.data_type === 'ARRAY' && column.udt_name === '_uuid') { // Array of _uuid is most certainly an n:m relation

        // many to many arrays should have JSON description - check for that
        try {
          const mtmRelationPayload = JSON.parse(column.comment);

          // check if referenced table exists
          if (mtmRelationPayload.reference != null &&
              mtmRelationPayload.reference.tableName != null &&
              dbObject.schemas[mtmRelationPayload.reference.schemaName].tables[mtmRelationPayload.reference.tableName] != null) {
            // create one side m:n
            manyToManyRelationBuilderHelper(dbObject, column, schemaName, tableName, mtmRelationPayload);
          }
        } catch (err) {
          // ignore error
        }
      }

    }

  } catch (err) {
    throw err;
  }
}

async function iterateAndAddConstraints(dbClient, dbObject, schemaName, tableName): Promise<void> {

  // keep reference to current table
  const currentTable = dbObject.schemas[schemaName].tables[tableName];

  // iterate other constraints
  const constraints = await dbClient.query(
  `SELECT
        tc.constraint_type    AS constraint_type,
        tc.constraint_name    AS constraint_name,
        tc.table_schema       AS schema_name,
        tc.table_name         AS table_name,
        kcu.column_name       AS column_name,
        ccu.table_schema      AS references_schema_name,
        ccu.table_name        AS references_table_name,
        ccu.column_name       AS references_column_name,
        rc.update_rule        AS on_update,
        rc.delete_rule        AS on_delete,
        pgc.consrc            AS check_code,
      obj_description(pgc.oid, 'pg_constraint') AS comment
       FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
         ON tc.constraint_catalog = kcu.constraint_catalog
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.referential_constraints rc
         ON tc.constraint_catalog = rc.constraint_catalog
        AND tc.constraint_schema = rc.constraint_schema
        AND tc.constraint_name = rc.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
         ON rc.unique_constraint_catalog = ccu.constraint_catalog
        AND rc.unique_constraint_schema = ccu.constraint_schema
        AND rc.unique_constraint_name = ccu.constraint_name
  LEFT JOIN pg_catalog.pg_constraint pgc
       ON pgc.conname = tc.constraint_name
      WHERE tc.table_schema = '${schemaName}' AND tc.table_name = '${tableName}';`
);

  // other constraints
  Object.values(constraints.rows).forEach((constraint) => {
		if (constraint.constraint_type === 'FOREIGN KEY') { // relations
      relationBuilderHelper(dbObject, constraint);
		} else if (constraint.constraint_type === 'CHECK') { // checks
      addCheck(constraint, currentTable);
    } else { // other constraints
      addConstraint(constraint.constraint_type, constraint, currentTable);
		}

	});

}

function addConstraint(constraintType,
                       constraintRow,
                       refDbObjectCurrentTable): void {

  let constraintName  = constraintRow.constraint_name;
  const columnName = constraintRow.column_name;
  // ignore constraint if no column name is set
  if (columnName == null) {
    return;
  }

  // add constraint name for not_nullable
  if (constraintType === 'not_null') {
    constraintName = `${refDbObjectCurrentTable.name}_${columnName}_not_null`;
  }

  // create new constraint if name was set
  if (constraintName != null) {
    const constraint = refDbObjectCurrentTable.constraints[constraintName] = refDbObjectCurrentTable.constraints[constraintName] || {
      type: constraintType,
      options: {},
      columns: []
    };
    // add column name to constraint - once
    if (constraint.columns.indexOf(columnName) === -1) {
      constraint.columns.push(columnName);
    }
  }

  // add constraint name to field
  const currentColumnRef = refDbObjectCurrentTable.columns[columnName];

  currentColumnRef.constraintNames = currentColumnRef.constraintNames || [];
  currentColumnRef.constraintNames.push(constraintName);
}

function addCheck(constraintRow, refDbObjectCurrentTable): void {
  const constraintName = constraintRow.constraint_name;
  const checkCode = constraintRow.check_code;
  // ignore and other constraints without code
  if (checkCode == null) {
    return;
  }

  // create new constraint if name was set
  if (constraintName != null) {
    refDbObjectCurrentTable.constraints[constraintName] = refDbObjectCurrentTable.constraints[constraintName] || {
      type: 'CHECK',
      options: {
       param1: checkCode
      }
    };

  }

  // add constraint name to field
  /* const currentColumnRef = refDbObjectCurrentTable.columns[columnName];
  currentColumnRef.constraintNames.push(constraintName);*/
}

function relationBuilderHelper(dbObject, constraint) {

  let relationPayloadOne: any = {};
  let relationPayloadMany: any = {};
  try {
    const relationPayload = JSON.parse(constraint.comment);

    relationPayloadOne = relationPayload.find((relation) => {
      return (relation.type === 'ONE');
    });
    relationPayloadMany = relationPayload.find((relation) => {
      return (relation.type === 'MANY');
    });

  } catch (err) {
    // ignore empty payload -> fallback in code below
  }

  const constraintName = relationPayloadOne.name || relationPayloadMany.name || constraint.constraint_name.replace('fk_', '');

  const constraintOneVirtualName = (relationPayloadOne != null) ? relationPayloadOne.virtualColumnName : constraint.column_name.split(':')[0];
  // if not available, "invent" virtual column name by making plural (maybe a library later for real plurals)
  const constraintManyVirtualName = (relationPayloadMany != null) ? relationPayloadMany.virtualColumnName : constraint.table_name.toLowerCase() + 's';

  const onUpdate = (constraint.on_update !== 'NO ACTION') ? constraint.on_update : null;
  const onDelete = (constraint.on_delete !== 'NO ACTION') ? constraint.on_delete : null;
  // create relation: one
  const relationOne: IDbRelation = {
    name: constraintName,
    type: 'ONE',
    schemaName: constraint.schema_name,
    tableName: constraint.table_name,
    columnName: constraint.column_name,
    virtualColumnName: constraintOneVirtualName,
    onUpdate,
    onDelete,
    // Name of the association
    description: null,
    // joins to
    reference: {
      schemaName: constraint.references_schema_name,
      tableName: constraint.references_table_name,
      columnName: constraint.references_column_name
    }
  };

  // create relation: many
  const relationMany: IDbRelation = {
    name: constraintName,
    type: 'MANY',
    schemaName: constraint.references_schema_name,
    tableName: constraint.references_table_name,
    columnName: null,
    virtualColumnName: constraintManyVirtualName,
    onUpdate: null,
    onDelete: null,
    // Name of the association
    description: null,
    // joins to
    reference: {
      schemaName: constraint.schema_name,
      tableName: constraint.table_name,
      columnName: null
    }
  };

  // add relation to dbObject
  dbObject.relations[constraintName] = [relationOne, relationMany];

  // remove FK column
  delete dbObject.schemas[relationOne.schemaName].tables[relationOne.tableName].columns[dbObject.relations[constraintName][0].columnName];

}

function manyToManyRelationBuilderHelper(dbObject, columnDescribingRelation, schemaName, tableName, mtmPayload) {

  const relationName = mtmPayload.name;

  // create relation: one
  const newRelation: IDbRelation = {
    name: relationName,
    type: 'MANY',
    schemaName,
    tableName,
    columnName: columnDescribingRelation.column_name,
    virtualColumnName: mtmPayload.virtualColumnName,
    onUpdate: null,
    onDelete: null,
    // Name of the association
    description: null,
    // joins to
    reference: {
      schemaName: mtmPayload.reference.schemaName,
      tableName: mtmPayload.reference.tableName,
      columnName: mtmPayload.reference.columnName
    }
  };

  // create relation object if not available
  dbObject.relations[mtmPayload.name] = dbObject.relations[mtmPayload.name] || [];
  dbObject.relations[mtmPayload.name].push(newRelation);

  // remove FK column
  delete dbObject.schemas[newRelation.schemaName].tables[tableName].columns[columnDescribingRelation.column_name];

}
