-- file_validate function sets the entityId of a file if not already set or deleted
CREATE OR REPLACE FUNCTION _meta.file_trigger() RETURNS trigger AS $$

    function validateFile(fileId, entityId) {
        var plan = plv8.prepare( 'SELECT _meta."file_validate($1, $2)"', ['uuid', 'uuid'] );
        var rows = plan.execute( [fileId, entityId] );
    }

    function invalidateFile(fileId, entityId) {
        var plan = plv8.prepare( 'SELECT _meta."file_invalidate($1, $2)"', ['uuid', 'uuid'] );
        var rows = plan.execute( [fileId, entityId] );
    }

    var tableId = TG_TABLE_SCHEMA + '.' + TG_TABLE_NAME;

    var plan = plv8.prepare( 'SELECT "fields" FROM _meta."FileFields" WHERE "id" = $1', ['text'] );
    var rows = plan.execute( [tableId] );

    if (rows == null || rows.length < 1) {
        plv8.elog(NOTICE, "This table has no file-fields.");
        if(TG_OP === 'INSERT' || TG_OP === 'UPDATE') {
            return NEW;
        }
        return OLD;
    }

    for(var i in rows) {
        var fieldName = rows[i];

        if (TG_OP === 'INSERT') {
            // ID field is required
            if (NEW.id == null) {
                throw new Error('ID is required.');
            }
            if (NEW[fieldName] == null) {
                return NEW;
            }
            // Validate all files, because they all are new.
            for(var j in NEW[fieldName]) {
                validateFile(NEW[fieldName][j], NEW.id)
            }
        }
        if (TG_OP === 'DELETE') {
            // ID field is required
            if (OLD.id == null) {
                throw new Error('ID is required.');
            }
            if (OLD[fieldName] == null) {
                return OLD;
            }
            for(var j in OLD[fieldName]) {
                invalidateFile(OLD[fieldName][j], OLD.id)
            }
        }
        if (TG_OP === 'UPDATE') {
            // ID field is required and can not be changed
            if (NEW.id == null || OLD.id == null || NEW.id != OLD.id) {
                throw new Error('ID can not be changed.');
            }

            // If the field is neither in NEW nor in OLD it can be ignored
            if (NEW[fieldName] == null && OLD[fieldName] == NULL) {
                return NEW;
            }

            // If the field has been removed in NEW, all files can be invalidated (like delete)
            if (NEW[fieldName] == null && OLD[fieldName] != null) {
                for(var j in OLD[fieldName]) {
                    invalidateFile(OLD[fieldName][j], OLD.id)
                }
                return NEW;
            }

            // If the field has been added in NEW, all files can be validated (like insert)
            if (NEW[fieldName] != null && OLD[fieldName] == null) {
                for(var j in NEW[fieldName]) {
                    validateFile(NEW[fieldName][j], NEW.id)
                }
                return NEW;
            }
            
            // If the field is available in both, we need to diff
            if (NEW[fieldName] != null && OLD[fieldName] != NULL) {
                // Validate new files
                for(var j in NEW[fieldName]) {
                    var fileId = NEW[fieldName][j];
                    if(OLD[fieldName].indexOf(fileId) < 0) {
                        validateFile(fileId, NEW.id)
                    }
                }
                // Invalidate old files
                for(var j in OLD[fieldName]) {
                    var fileId = OLD[fieldName][j];
                    if(OLD[fieldName].indexOf(fileId) < 0) {
                        invalidateFile(fileId, NEW.id)
                    }
                }
            }
        }
    }

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
            FOR v_field_value IN SELECT * FROM jsonb_array_elements(v_new)
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
$$ LANGUAGE "plv8";