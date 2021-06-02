-- file_validate function sets the entityId of a file if not already set or deletedAt
CREATE OR REPLACE FUNCTION _file_storage.file_trigger_plpgsql() RETURNS trigger AS $$
DECLARE
    v_columns jsonb;
    v_query TEXT;
    v_row jsonb;
    v_column_name TEXT;
    v_file_name TEXT;
    v_temp TEXT;
    v_new_value jsonb;
    v_old_value jsonb;
    v_file_name_elements TEXT[];
BEGIN
    v_query := $tok$SELECT json_agg(row_to_json(fc)) AS "fields" FROM _file_storage."Columns" AS fc WHERE "schemaName" = %L AND "tableName" = %L;$tok$;
    EXECUTE format(v_query, TG_TABLE_SCHEMA, TG_TABLE_NAME) INTO v_columns;
    
    FOR v_row IN SELECT * FROM jsonb_array_elements(v_columns)
	LOOP
	  v_column_name := v_row->>'columnName';
	  v_new_value := NULL;
	  v_old_value := NULL;
	  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
	  	EXECUTE format('SELECT ($1).%s::text', v_column_name) USING NEW INTO v_new_value;
	  END IF;
	  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
	  	EXECUTE format('SELECT ($1).%s::text', v_column_name) USING OLD INTO v_old_value;
	  END IF;
	  
	  IF TG_OP = 'INSERT' THEN
	  	IF NEW.id IS NULL THEN
	  	  RAISE EXCEPTION 'Id is required';
	    END IF;
	    
	  	IF v_new_value IS NULL THEN
	  	  CONTINUE;
	    END IF;
	    
	    FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_new_value)
		  LOOP
		  	v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	v_file_name := v_file_name_elements[2];
	  		RAISE NOTICE 'v_file_name %', v_file_name;
			v_temp := _file_storage.file_validate(v_file_name, NEW.id, _file_storage.jsonb_arr2text_arr(v_row->'types'));
		  END LOOP;
	  END IF;
	  
	  IF TG_OP = 'DELETE' THEN
	  	IF OLD.id IS NULL THEN
	  	  RAISE EXCEPTION 'Id is required';
	    END IF;
	    
	  	IF v_old_value IS NULL THEN
	  	  CONTINUE;
	    END IF;
	    
	    FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_old_value)
		  LOOP
		  	v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	v_file_name := v_file_name_elements[2];
			v_temp := _file_storage.file_invalidate(v_file_name, OLD.id);
		  END LOOP;
	  END IF;
	  
	  IF TG_OP = 'UPDATE' THEN
	  	IF NEW.id IS NULL OR OLD.id IS NULL OR NEW.id != OLD.id THEN
	  	  RAISE EXCEPTION 'Id is required and cannot be changed';
	    END IF;
	    
	  	IF v_new_value IS NULL AND v_old_value IS NULL THEN
	  	  CONTINUE;
	    END IF;
	    
	  	IF v_new_value IS NULL AND v_old_value IS NOT NULL THEN
	  	  FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_old_value)
		    LOOP
		  	  v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	  v_file_name := v_file_name_elements[2];
		      v_temp := _file_storage.file_invalidate(v_file_name, OLD.id);
		  END LOOP;
	  	  CONTINUE;
	    END IF;
	    
	  	IF v_new_value IS NOT NULL AND v_old_value IS NULL THEN
	  	  FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_new_value)
		    LOOP
		  	  v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	  v_file_name := v_file_name_elements[2];
		      v_temp := _file_storage.file_validate(v_file_name, NEW.id, _file_storage.jsonb_arr2text_arr(v_row->'types'));
		  END LOOP;
	  	  CONTINUE;
	    END IF;
	    
	    
	  	IF v_new_value IS NOT NULL AND v_old_value IS NOT NULL THEN
	  	  FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_new_value)
		    LOOP
		  	  v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	  v_file_name := v_file_name_elements[2];
		      IF (ARRAY[v_file_name] <@ _file_storage.jsonb_arr2text_arr(v_old_value)) IS FALSE THEN
		      	v_temp := _file_storage.file_validate(v_file_name, NEW.id, _file_storage.jsonb_arr2text_arr(v_row->'types'));
		      END IF;
		  END LOOP;
		  FOR v_file_name IN SELECT * FROM jsonb_array_elements(v_old_value)
		    LOOP
		  	  v_file_name_elements := regexp_split_to_array(v_file_name, '"');
		  	  v_file_name := v_file_name_elements[2];
		      IF (ARRAY[v_file_name] <@ _file_storage.jsonb_arr2text_arr(v_new_value)) IS FALSE THEN
		      	v_temp := _file_storage.file_invalidate(v_file_name, OLD.id);
		      END IF;
		  END LOOP;
	    END IF;
	  END IF;
	  
	END LOOP;
  	-- RAISE EXCEPTION 'Foobar';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;