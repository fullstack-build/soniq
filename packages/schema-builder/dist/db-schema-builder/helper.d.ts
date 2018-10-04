/**
 * Helper
 */
export declare function splitActionFromNode(
  actionKey: any,
  node?: {}
): {
  action: any;
  node: any;
};
/**
 * Deep diff between two object, using lodash
 * @param  {Object} obj Object compared
 * @param  {Object} base  Object to compare with
 * @param  {boolean} ignoreValue  Ignore different string, number and boolean values
 * @return {Object}        Return a new object who represent the diff
 */
export declare function difference(obj: {}, base: {}, ignoreValue?: boolean): any;
/**
 * Deep add key and value to last node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export declare function addToLastNode(obj: {}, addKey: string, addValue: any): any;
/**
 * Deep add key and value to every node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export declare function addToEveryNode(obj: {}, addKey: string, addValue: any): any;
/**
 * Deep removal key from every node
 * @param  {Object} obj Object compared
 * @param  {string} removeKey  key that should be added
 * @return {Object}        Return a new object who represent the diff
 */
export declare function removeFromEveryNode(obj: {}, removeKey: string): any;
/**
 * Deep removal of empty objects
 * @param  {Object} obj Object to be cleaned
 * @return {Object}        Return a new cleaned up object
 */
export declare function cleanObject(obj: {}): {};
export declare function getPropertiesWithoutNested(obj: any, propertiesToIgnore?: string[]): any;
