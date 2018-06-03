
-- file_deleteone function deletes one file finally => for usage after deleted from bucket
CREATE OR REPLACE FUNCTION _meta.file_deleteone_admin(i_file_id uuid) RETURNS SETOF _meta."Files" AS $$
	DELETE FROM _meta."Files" 
    WHERE "id" = i_file_id AND "entityId" IS NOT NULL AND "deletedAt" IS NOT NULL AND _meta.is_admin() = true
    RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;