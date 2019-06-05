CREATE OR REPLACE FUNCTION _meta.create_version() RETURNS trigger AS $$

  // init plv8 require
  plv8.execute( 'SELECT _meta.plv8_require();' );

  const jsonPatch = require('rfc6902');
  const diff = jsonPatch.createPatch({}, NEW);

	const currentRoleResult = plv8.execute('SELECT current_role;');
	var currentUserId = null;
	try {
	  currentUserId = plv8.execute('SELECT _auth.current_user_id_or_null() id;')[0].id;
	} catch (err){
	  // ignore error
	}

	var currentRole =  (currentRoleResult != null && currentRoleResult[0] != null && currentRoleResult[0].current_role != null)? currentRoleResult[0].current_role : "";
	if (TG_OP !== 'DELETE') {
	  plv8.execute('INSERT INTO "_versions"."' + TG_TABLE_SCHEMA +'_' + TG_TABLE_NAME +'" (user_id, created_by, action, table_name, table_id, state, diff) VALUES ($1, $2, $3, $4, $5, $6, $7)', [currentUserId, currentRole, TG_OP, TG_TABLE_NAME, NEW.id, NEW, diff]);
	} else {
	  plv8.execute('INSERT INTO "_versions"."' + TG_TABLE_SCHEMA +'_' + TG_TABLE_NAME +'" (user_id, created_by, action, table_name, table_id, state, diff) VALUES ($1, $2, $3, $4, $5, $6, $7)', [currentUserId, currentRole, TG_OP, TG_TABLE_NAME, OLD.id, OLD, diff]);
	}

$$ LANGUAGE plv8;
