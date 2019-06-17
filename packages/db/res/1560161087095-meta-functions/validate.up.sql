-- FUNCTION: _meta.validate(text, text, text)
--DROP FUNCTION _meta.validate(text, text, text) CASCADE;
CREATE OR REPLACE FUNCTION _meta.validate(
	type text,
	value text,
	parameter text)
    RETURNS boolean
    LANGUAGE 'plv8'
    COST 100
    VOLATILE
AS $BODY$
  // init plv8 require
  plv8.execute( 'SELECT _meta.plv8_require();' );

  var validator = require('validator');
  var parsedParameter;
  // parse if parameter is json
  try {
    parsedParameter = JSON.parse(parameter);
  } catch (e) {}

  if(validator[type] == null) {
  	throw new Error('validator.unknown ' + type);
  }

  return validator[type](value, parsedParameter);

$BODY$;