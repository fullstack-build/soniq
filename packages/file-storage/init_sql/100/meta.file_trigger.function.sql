-- file_validate function sets the entityId of a file if not already set or deleted
CREATE OR REPLACE FUNCTION _meta.file_trigger() RETURNS trigger AS $$
DECLARE
    v_fields jsonb;
    v_field TEXT;
    v_table_id TEXT;
    v_query TEXT;
    v_old jsonb;
    v_new jsonb;
BEGIN
    v_table_id := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME;

    v_query := $tok$SELECT "fields" FROM _meta."FileFields" WHERE "id" = %L$tok$;
    EXECUTE format(v_query, v_table_id) INTO v_fields;

    IF v_fields IS NULL THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            RETURN NEW;
        END IF;
        RETURN OLD;
    END IF;

    FOR v_field IN SELECT * FROM jsonb_array_elements(v_fields)
    LOOP
        RAISE NOTICE 'output from space %', v_field;
        
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            EXECUTE format('SELECT ($1).%s::jsonb', v_field)
            USING NEW
            INTO v_new;
        END IF;

        IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
            EXECUTE format('SELECT ($1).%s::jsonb', v_field)
            USING OLD
            INTO v_old;
        END IF;

        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            FOR v_field IN SELECT * FROM jsonb_array_elements(v_fields)
            LOOP

            END LOOP;
        END IF;


    END LOOP;

    IF TG_OP = 'INSERT' THEN
        
    END IF;

    IF v_deleted IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has been deleted!';
    END IF;

    IF v_entity_id IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has already been added to an entity!';
    END IF;
END;
$$ LANGUAGE plpgsql;