## examples
* SELECT _meta.validate('test123@gmail.com', 'isEmail', '');
* SELECT _meta.validate('test123_gmail.com', 'contains', 'test');
* SELECT _meta.validate('2017-12-11', 'isAfter', '2017-12-10');
* SELECT _meta.validate('19.5', 'isFloat', '{ "min": 7.22, "max": 9.55 }');
* SELECT _meta.sanitize('test@Gmail.com ', 'normalizeEmail', '');
