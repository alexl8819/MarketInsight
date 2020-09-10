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
const { readdirSync } = require('fs');
const { randomBytes } = require('crypto');
const pify = require('pify');
const both = require('ramda/src/both');
const is = require('ramda/src/is');
const not = require('ramda/src/not');
const all = require('ramda/src/all');
const equals = require('ramda/src/equals');
const where = require('ramda/src/where');
const assoc = require('ramda/src/assoc');
const map = require('ramda/src/map');
const filter = require('ramda/src/filter');
const pipe = require('ramda/src/pipe');
const pick = require('ramda/src/pick');
const values = require('ramda/src/values');
const contains = require('ramda/src/contains');
const take = require('ramda/src/take');
const concat = require('ramda/src/concat');
const slice = require('ramda/src/slice');
const reduce = require('ramda/src/reduce');
const curry = require('ramda/src/curry');
const toPairs = require('ramda/src/toPairs');
const fromPairs = require('ramda/src/fromPairs');
const keys = require('ramda/src/keys');
const adjust = require('ramda/src/adjust');
const indexOf = require('ramda/src/indexOf');
const indexBy = require('ramda/src/indexBy');
const prop = require('ramda/src/prop');
const propEq = require('ramda/src/propEq');
const toUpper = require('ramda/src/toUpper');
const toLower = require('ramda/src/toLower');
const isEmpty = require('ramda/src/isEmpty');
const isNil = require('ramda/src/isNil');
const trim = require('ramda/src/trim');
const forEach = require('ramda/src/forEach');
const find = require('ramda/src/find');
const length = require('ramda/src/length');
const sort = require('ramda/src/sort');
const difference = require('ramda/src/difference');
const partition = require('ramda/src/partition');
const endsWith = require('ramda/src/endsWith');
const split = require('ramda/src/split');
const join = require('ramda/src/join');
const fetch = require('cross-fetch');
const validator = require('is-my-json-valid');
const HttpError = require('./error');
//
const isNumber = curry((val) => is(Number)(val));
//
const isString = curry((val) => is(String)(val));
//
const isObject = curry((val) => is(Object)(val));
//
const isFunc = curry((val) => is(Function)(val));
//
const isArray = curry((val) => is(Array)(val));
//
const isError = curry((val) => is(Error)(val));
//
const flattenToArray = curry((obj) => map(values)(obj));
//
const uppercaseArray = curry((ite) => map(toUpper)(ite));
//
const lowercaseArray = curry((ite) => map(toLower)(ite));
//
const trimArray = curry((ite) => map(trim)(ite));
//
const notNil = curry((e) => not(isNil)(e));
// 
const isStringArray = curry((ite) => both(isArray, all(isString))(ite));
//
const filterEmpty = curry((ite) => filter((e) => not(isEmpty(e)))(ite));
//
const capitalizeArray = curry((ite) => map(pipe(split(''), adjust(toUpper, 0), join('')))(ite));
//
const containsFilter = curry((key, set, ite) => filter(
  where(prop(key, ite), set)
)(ite));
//
const pickOut = curry((keys, ite) => map(pick(keys))(ite));
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
// Matches value by key
const matchByKey = (target, key, value, obj) => find(
  propEq(key, value), 
  filter(prop(target))(obj)
);
// 
const removeItemBySlice = curry((item, items) => concat(slice(0, indexOf(item, items), items), slice(indexOf(item, items) + 1, length(items), items)));
// Filters by file extention
const filterByExt = curry((ext, arr) => partition(endsWith(`.${ext}`), arr)[0]);
// Validates json structure with provided schema
const validateJSON = curry((schema, json) => validator(schema)(json));
// List dir
const listDir = curry((path) => readdirSync(path));
// Minimizes text
const minimizeText = (text, min, max) => 
  length(text) >= max ? concat(slice(0, min, text), '...') : text;
// Generates random id
async function generateIdentifier (bytes = 64) {
  ok(isNumber(bytes), 'bytes is not a number');
  
  const randomBytesPromise = pify(randomBytes);
  const buf = await randomBytesPromise(bytes);
  
  return buf.toString('hex');
}
// Fetches json document
async function fetchJSON (url) {
  ok(isString(url), 'url is not a string');

  const response = await fetch(url);
  const json = await response.json();

  if (response.status >= 400) {
    throw new HttpError(json.error, response.status);
  }

  return json;
}
// Sorted set of strings
class SortedStringSet extends Set {
  _sort () {
    const values = this.toArray();

    if (!values.length) {
      return;
    }

    super.clear();
    forEach((val) => super.add(val), sort((a, b) => a.localeCompare(b), values));
  }
  
  add (value) {
    if (!isString(value)) {
      return false;
    }

    if (isEmpty(value)) {
      return false;
    }
    
    super.add(toUpper(value));
    this._sort();
    return this;
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
  listDir,
  fetchJSON,
  validateJSON,
  generateIdentifier,
  filterByExt,
  minimizeText,
  indexOf,
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
  equals,
  trim,
  split,
  join,
  slice,
  keys,
  forEach,
  toUpper,
  toLower,
  isEmpty,
  isNumber,
  isString,
  isObject,
  isFunc,
  isArray,
  isError,
  isNil,
  notNil,
  length,
  difference,
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
  removeItemBySlice,
  capitalizeArray,
  SortedStringSet,
  StrictObjectSet
};
