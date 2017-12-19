CREATE OR REPLACE FUNCTION _meta.validate(type text, value text, parameter text) RETURNS bool AS $$

  var validator = require('validator');
  // parsse if parameter is json
  try {
    parameter = JSON.parse(parameter);
  } catch (e) {}

  return validator[type](value, parameter);

$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION _meta.sanitize(type text, value text, parameter text) RETURNS text AS $$

  var validator = require('validator');
  // parsse if parameter is json
  try {
    parameter = JSON.parse(parameter);
  } catch (e) {}

  return validator[type](value, parameter);

$$ LANGUAGE plv8;


-- examples

SELECT _meta.validate('test123@gmail.com', 'isEmail', '');


SELECT _meta.validate('test123_gmail.com', 'contains', 'test');


SELECT _meta.validate('2017-12-11', 'isAfter', '2017-12-10');


SELECT _meta.validate('19.5', 'isFloat', '{ "min": 7.22, "max": 9.55 }');


SELECT _meta.sanitize('test@Gmail.com ', 'normalizeEmail', '');