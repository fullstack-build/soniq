DROP TRIGGER "createSubscription" ON subscriptions;
CREATE TRIGGER "createSubscription"
  BEFORE INSERT
  ON subscriptions FOR EACH ROW
  EXECUTE PROCEDURE "createSubscription"();

DROP FUNCTION "createSubscription"() CASCADE;

CREATE OR REPLACE FUNCTION "createSubscription"() RETURNS TRIGGER AS $$
DECLARE
    queryHash TEXT;
    cleanQuery TEXT;
    previousName TEXT;
    currentName TEXT;
--    deltaName TEXT;

BEGIN
	cleanQuery := replace(NEW.query, ';', '');
	-- create query hash
	queryHash := encode(digest(NEW.query, 'sha256'), 'hex');
	NEW."queryHash" = queryHash;

    previousName := '"' || NEW.id || '_previous"';
    currentName  := '"' || NEW.id || '_current"';
--    deltaName    := '"' || NEW.id || '_delta"';

	-- create prev materialezed view
	EXECUTE 'CREATE MATERIALIZED VIEW ' || previousName || ' AS SELECT md5(row_to_json(h.*)::text) AS hash FROM (' || cleanQuery || ') h';

	-- create current view
	EXECUTE 'CREATE VIEW ' || currentName || ' AS SELECT md5(row_to_json(p.*)::text) AS hash, row_to_json(p.*) result FROM (' || cleanQuery || ') p';

	-- create delta view
--	EXECUTE 'CREATE VIEW ' || deltaName || ' AS SELECT ' || currentName ||  '.* FROM ' || currentName || ' FULL OUTER JOIN ' || previousName || ' USING (id) WHERE ' || currentName || '.id IS NULL OR ' || previousName || '.id IS NULL';

	-- return trigger
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "endSubscription"
  BEFORE DELETE
  ON subscriptions FOR EACH ROW
  EXECUTE PROCEDURE "endSubscription"();

CREATE OR REPLACE FUNCTION "endSubscription"() RETURNS TRIGGER AS $$
DECLARE
    previousName TEXT;
    currentName TEXT;
--    deltaName TEXT;
BEGIN
    previousName := '"' || OLD.id || '_previous"';
    currentName  := '"' || OLD.id || '_current"';
--    deltaName    := '"' || OLD.id || '_delta"';

	-- drop all subscriptions related views
--	EXECUTE 'DROP VIEW ' || deltaName || ' CASCADE';
	EXECUTE 'DROP MATERIALIZED VIEW ' || previousName || ' CASCADE';
	EXECUTE 'DROP VIEW ' || currentName || ' CASCADE';

	-- return trigger
	RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- old
CREATE OR REPLACE FUNCTION publishTrigger() RETURNS TRIGGER AS $$
DECLARE
	subscriptionCursor CURSOR FOR SELECT * FROM subscriptions;
	subscription subscriptions%rowtype;
	deltaIds uuid[];
BEGIN


	-- iterate subscriptions
	FOR subscription in subscriptionCursor LOOP
    	-- collect all updated entries
		EXECUTE FORMAT('SELECT ARRAY_AGG(id) FROM %s', quote_ident(subscription.id || '_delta')) INTO deltaIds;

--		INSERT INTO notifications (payload) VALUES(deltaIds);

		-- NOTIFY SUBSCRIBERS
		PERFORM PG_NOTIFY(subscription.id::text, array_to_json(deltaIds)::TEXT);

	    -- update materialized view
		EXECUTE FORMAT('REFRESH MATERIALIZED VIEW "%s_previous"', subscription.id); -- don't run CONCURRENTLY, otherwise we miss out

    END LOOP;

	-- return trigger
	RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- new
CREATE OR REPLACE FUNCTION publishTrigger() RETURNS TRIGGER AS $$
DECLARE
	subscriptionCursor CURSOR FOR SELECT * FROM subscriptions;
	subscription subscriptions%rowtype;
BEGIN

	-- iterate subscriptions
	FOR subscription in subscriptionCursor LOOP
		-- NOTIFY SUBSCRIBERS
		PERFORM PG_NOTIFY(subscription.id::text, 'update (add meta like schemaName, tableName, rowId, operation (INSERT; UPDATE; DELETE) later');

    END LOOP;

	-- return trigger
	RETURN NEW;
END
$$ LANGUAGE plpgsql;


-- should be added by directive @subscribable
CREATE TRIGGER publishToSubscribers AFTER INSERT OR UPDATE OR DELETE ON "Post" FOR EACH ROW EXECUTE PROCEDURE publishTrigger();

CREATE TRIGGER publishToSubscribers AFTER INSERT OR UPDATE OR DELETE ON "User" FOR EACH ROW EXECUTE PROCEDURE publishTrigger();

----------------------