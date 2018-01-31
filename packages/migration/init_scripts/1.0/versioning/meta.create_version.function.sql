CREATE OR REPLACE FUNCTION _meta.create_version() RETURNS trigger AS $$
	var currentRole =  (currentRoleResult != null && currentRoleResult[0] != null && currentRoleResult[0].current_role != null)? currentRoleResult[0].current_role : "";
  	plv8.execute('INSERT INTO ' + TG_TABLE_SCHEMA + '_versions.' + TG_TABLE_NAME +' (created_by, action, table_name, table_id, state, diff) VALUES ($1, $2, $3, $4, $5, $6)', [currentRole, TG_OP, TG_TABLE_NAME, NEW.id, NEW, diff]);
$$ LANGUAGE plv8;