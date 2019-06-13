## examples
* SELECT _meta.validate('isEmail', 'test123@gmail.com', '');
* SELECT _meta.validate('contains', 'test123_gmail.com', 'test');
* SELECT _meta.validate('isAfter', '2017-12-11', '2017-12-10');
* SELECT _meta.validate('isFloat', '19.5', '{ "min": 7.22, "max": 9.55 }');
* SELECT _meta.sanitize('normalizeEmail', 'test@Gmail.com ', '');
