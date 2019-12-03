
-- file_deleteone function deletes one file finally => for usage after deleted from bucket
CREATE OR REPLACE FUNCTION _file_storage.file_deleteone_admin(i_file_id uuid) RETURNS SETOF _file_storage."Files" AS $$
	DELETE FROM _file_storage."Files" 
    WHERE "id" = i_file_id AND "entityId" IS NOT NULL AND "deletedAt" IS NOT NULL AND _auth.is_admin() = true
    RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;