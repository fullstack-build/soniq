import { isObject } from 'util';
import * as _ from 'lodash';

/**
 * Helper
 */

export function splitActionFromNode(actionKey, node: {} = {}): {action: any, node: any} {
  const action = node[actionKey] || {};
  // remove action from obj
  delete node[actionKey];

  return {
    action,
    node
  };
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} obj Object compared
 * @param  {Object} base  Object to compare with
 * @param  {boolean} ignoreValue  Ignore different string, number and boolean values
 * @return {Object}        Return a new object who represent the diff
 */
export function difference(obj: {}, base: {}, ignoreValue: boolean = false) {
  function changes(pObj, pBase) {
    return _.transform(pObj, (result, value, key) => {
      let thisValue = value;
      // ignore different string, number and boolean values
      if (!!ignoreValue) {
        // ignoring done by replacing old value with new value
        if (typeof thisValue === 'string' || typeof thisValue === 'number' || typeof thisValue === 'boolean') {
          thisValue = pBase[key];
        }
      }
      // deep equal
      if (!_.isEqual(thisValue, pBase[key])) {
        result[key] = (isObject(thisValue) && isObject(pBase[key])) ? changes(thisValue, pBase[key]) : thisValue;
      }
    });
  }
  return changes(obj, base);
}

/**
 * Deep add key and value to last node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export function addToLastNode(obj: {}, addKey: string, addValue: any) {
  function nested(pObj) {
    return _.transform(pObj, (result, value, key) => {
      // check if object has children
      const hasChildren = (Object.values(pObj).find((thisVal) => {
        return isObject(thisVal);
      }) != null);
      // add to last node
      if (!hasChildren) {
        result[addKey] = addValue;
      }
      // recursion
      result[key] = (isObject(value)) ? nested(value) : value;
    });
  }
  return nested(obj);
}

/**
 * Deep add key and value to every node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export function addToEveryNode(obj: {}, addKey: string, addValue: any) {
  function nested(pObj) {
    return _.transform(pObj, (result, value, key) => {
      // add to very "object" node
      result[addKey] = addValue;
      // recursion
      result[key] = (isObject(value)) ? nested(value) : value;
    });
  }
  return nested(obj);
}

/**
 * Deep removal key from every node
 * @param  {Object} obj Object compared
 * @param  {string} removeKey  key that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export function removeFromEveryNode(obj: {}, removeKey: string) {
  function nested(pObj) {
    return _.transform(pObj, (result, value, key) => {
      // remove from every node
      if (value != null) {
        delete value[removeKey];
      }
      // recursion
      result[key] = (isObject(value)) ? nested(value) : value;
    });
  }
  return nested(obj);
}

/**
 * Deep removal of empty objects
 * @param  {Object} obj Object to be cleaned
 * @return {Object}        Return a new cleaned up object
 */
export function cleanObject(obj: {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value === undefined) {
        delete obj[key];
      }

      if (typeof value === 'object' && !(value instanceof Date)) {
        cleanObject(obj[key]);

        if (value === null) {
          continue;
        }

        if (!Array.isArray(value) && !Object.keys(value).length) {
          delete obj[key];
        }
      }
    }
  }

  return obj;
}

// returns simple object without nested objects
export function getPropertiesWithoutNested(obj, propertiesToIgnore: string[] = []) {
  if (obj != null) {
    return Object.entries(obj).reduce((result, entry) => {
      const key = entry[0];
      const val = entry[1];
      if (!isObject(val) && propertiesToIgnore.indexOf(key) === -1) {
        result[key] = val;
      }
      return result;
    }, {});
  }
  return obj;
}
