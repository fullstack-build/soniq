-- FUNCTION: _meta.sanitize(text, text, text)
-- DROP FUNCTION _meta.sanitize(text, text, text);
CREATE OR REPLACE FUNCTION _meta.sanitize(
	type text,
	value text,
	parameter text)
    RETURNS text
    LANGUAGE 'plv8'

    COST 100
    VOLATILE
AS $BODY$

  var validator = require('validator');
  // parse if parameter is json
  try {
    parameter = JSON.parse(parameter);
  } catch (e) {}

  return validator[type](value, parameter);

$BODY$;
