/**
 * lib/network/dispatch.js - Message dispatcher
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

const { isNil, isFunc } = require('../util');

class NaiveMessageDispatcher {
  constructor (defaultFn = () => {}) {
    this._handlers = new Map();
    this._defaultFn = defaultFn;
  }

  put (matchFn, dispatchFn) {
    ok(isFunc(matchFn), 'matchFn is not a function');
    ok(isFunc(dispatchFn), 'dispatchFn is not a function');

    this._handlers.set(matchFn, dispatchFn);
  }

  findMatch (message) {
    ok(!isNil(message), 'message is not valid');

    const iterator = this._handlers.entries();
    let entry;
    
    while(!(entry = iterator.next()).done) {
      const isMatch = entry.value[0];
      const invokeFn = entry.value[1];

      if (isMatch(message)) {
        return invokeFn(message);
      }
    }
    
    return this._defaultFn(message);
  }
}

module.exports = NaiveMessageDispatcher;
