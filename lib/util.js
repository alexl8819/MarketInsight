/**
 * lib/util.js - General utility functions
 * Copyright (C) 2018  idealwebsolutions
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
const { ok } = require('assert');
const { readFile } = require('fs');
const { promisify } = require('util');
const { randomBytes } = require('crypto');
const {
  is,
  not,
  all,
  equals,
  where,
  assoc, 
  map, 
  filter,
  pipe, 
  pick, 
  values,
  contains,
  take,
  concat,
  slice, 
  reduce, 
  curry, 
  toPairs, 
  fromPairs, 
  keys,
  adjust, 
  indexBy, 
  prop, 
  propEq,
  toUpper,
  toLower,
  isEmpty,
  isNil,
  trim,
  forEach,
  find,
  length,
  sort
} = require('ramda');
const fetch = require('cross-fetch');
const validator = require('is-my-json-valid');
// const Set = require('es6-set/polyfill')
//
const isNumber = curry((val) => is(Number)(val));
//
const isString = curry((val) => is(String)(val));
//
const isObject = curry((val) => is(Object)(val));
//
const flattenToArray = curry((obj) => map(values)(obj));
//
const uppercaseArray = curry((ite) => map(toUpper)(ite));
//
const lowercaseArray = curry((ite) => map(toLower)(ite));
//
const trimArray = curry((ite) => map(trim)(ite));
//
const isStringArray = curry((ite) => all(isString)(ite));
//
const filterEmpty = curry((ite) => filter((e) => not(isEmpty(e)))(ite));
//
const containsFilter = curry((key, set, ite) => filter(
  where(prop(key, ite), set)
)(ite));
//
const pickOut = curry((keys, ite) => map(pick(keys))(ite));
/*const mapKey = curry(
  (key, fn, obj) => pipe(map(over(lens(prop(key)), fn)))(obj)
)*/
// Applys function to first index 
const removeObjKey = curry(
  (fn, obj) => pipe(
    toPairs, 
    map(slice(1, Infinity)), 
    map(adjust(fn, 0)), 
    fromPairs
  )(obj)
);
// Renames keys of an object
const renameKeys = curry(
  (keysMap, obj, ite) => map(reduce(
    (acc, key) => assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj)
  ))(ite)
);
// Renames object by own property 
const renameObjByProp = curry(
  (key, obj) => pipe(indexBy(prop(key)))(obj)
);
// Flattens object value to selected key in value
const flattenObjectValue = curry(
  (key, index, obj) => pipe(toPairs, map(adjust(prop(key), index)))(obj)
);
// Reduce to single value
const reduceToProp = curry((key, obj) => map(prop(key))(obj));
//
const matchByKey = (target, key, value, obj) => find(
  propEq(key, value), 
  filter(prop(target))(obj)
)

// Validates json structure with provided schema
const validateJSON = curry((schema, json) => validator(schema)(json));
//
const minimizeText = (text, min, max) => 
  length(text) >= max ? concat(slice(0, min, text), '...') : text;
//
const noop = () => {};
// Render HTML
async function renderHTML (path) {
  ok(isString(path), 'path is not a string');

  const readFilePromise = promisify(readFile);
  const contents = await readFilePromise(path, 'utf8');
  
  return contents;
}
// Generates random id
async function generateIdentifier (bytes = 64) {
  ok(isNumber(bytes), 'bytes is not a number');
  
  const randomBytesPromise = promisify(randomBytes);
  const buf = await randomBytesPromise(bytes);
  
  return buf.toString('hex');
}
// Fetches json document
async function fetchJSON (url) {
  ok(isString(url), 'url is not a string');

  const response = await fetch(url);

  if (response.status >= 400) {
    throw new Error(`fetchJSON: Invalid response code: ${response.status}`);
  }

  const json = await response.json();
  
  return json;
}
// Strict set of strings
class StrictStringSet extends Set {
  add (value) {
    if (!isString(value)) {
      return false;
    }

    if (isEmpty(value)) {
      return false;
    }

    return super.add(toUpper(value));
  }

  toArray () {
    return Array.from(this.values());
  }
}
// Strict set of objects
class StrictObjectSet extends Set {
  has (needle) {
    const iterator = this.values();
    let item;
    
    while(!(item = iterator.next()).done) {
      if (equals(item.value, needle)) {
        return true;
      }
    }

    return false;
  }

  add (item) {
    if (this.has(item)) {
      return false;
    }

    return super.add(item);
  }

  toArray () {
    return Array.from(this.values());
  }
}

module.exports = {
  renderHTML,
  fetchJSON,
  validateJSON,
  generateIdentifier,
  minimizeText,
  pipe,
  concat,
  map,
  sort,
  filter,
  assoc,
  pick,
  take,
  find,
  propEq,
  contains,
  trim,
  keys,
  forEach,
  toUpper,
  toLower,
  isEmpty,
  isNumber,
  isString,
  isObject,
  isNil,
  length,
  matchByKey,
  renameKeys,
  renameObjByProp,
  reduceToProp,
  flattenObjectValue,
  flattenToArray,
  uppercaseArray,
  lowercaseArray,
  trimArray,
  isStringArray,
  filterEmpty,
  containsFilter,
  pickOut,
  removeObjKey,
  noop,
  StrictStringSet,
  StrictObjectSet
};
