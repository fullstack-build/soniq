CREATE OR REPLACE FUNCTION _meta.triggerUpdateOrCreate() RETURNS trigger AS $$
	NEW['updatedAt'] = plv8.execute( 'SELECT NOW() AT TIME ZONE \'UTC\' now;')[0].now;
	return NEW;
$$ LANGUAGE plv8 STABLE;