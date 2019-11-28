
CREATE OR REPLACE FUNCTION _graphql_meta.updated_at_trigger() RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW() AT TIME ZONE 'UTC';
    RETURN NEW;   
END;
$$ language plpgsql;