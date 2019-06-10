CREATE OR REPLACE FUNCTION _meta.make_table_immutable() RETURNS trigger AS $$
BEGIN
    -- Raise exeption: immutable
    RAISE EXCEPTION 'immutable: Table is immutable.';
END;
$$ LANGUAGE plpgsql STABLE;