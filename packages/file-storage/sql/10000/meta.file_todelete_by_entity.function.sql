
-- file_clearupone function deletes all temporary files of a user which have not been added to an entity
CREATE OR REPLACE FUNCTION _meta.file_todelete_by_entity(i_entity_id uuid) RETURNS SETOF _meta."Files" AS $$
	SELECT * FROM _meta."Files"
    WHERE "entityId" = i_entity_id AND "deletedAt" IS NOT NULL AND _auth.is_admin() = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;