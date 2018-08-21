/**
 * lib/watch.js - Market watch synchronization state
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
const debug = require('debug')('watch');

const { Server } = require('./network');
const { 
  SyncMessage, 
  ErrorMessage 
} = require('./network/messages');
const { tradeableSymbols } = require('./stock'); // cached symbol list
const {
  length, 
  forEach,
  contains,
  trim,
  toUpper,
  isString,
  isObject,
  isStringArray,
  StrictStringSet
} = require('./util');
const { 
  MAX_WATCH_LIMIT, 
  NOOP 
} = require('./constants');

class MarketWatch extends Server {
  constructor (defaultSymbols = ['TSLA'], options = {}) {
    super(options);

    this._symbols = new StrictStringSet(defaultSymbols);
  }

  _subscribe (symbol) {
    ok(isString(symbol), 'symbol is not a string');
    
    const normalizedSymbol = toUpper(trim(symbol));

    if (!contains(normalizedSymbol, tradeableSymbols.current)) {
      return false;
    }

    if (this._symbols.size > MAX_WATCH_LIMIT) {
      return false;
    }

    return isObject(this._symbols.add(normalizedSymbol));
  }

  shutdown () {
    this._symbols.clear();
    super.shutdown();
  }

  update (symbols = []) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
    // At least one stock must be present
    if (!length(symbols)) {
      throw new RangeError('Invalid range: a single stock must be listed');
    }
    // Check if symbol length is valid
    if (length(symbols) > length(this._symbols)) {
      if(length(symbols) - length(this._symbols) > 1) {
        throw new RangeError('Invalid range: only a single update allowed');
      }
    } else if (length(symbols) < length(this._symbols)) {
      if (length(this._symbols) - length(symbols)) {
        throw new RangeError('Invalid range: only a single update allowed');
      }
    }
    // Clear existing symbol list
    this._symbols.clear();
    // Rebuild by subscribing to valid symbols
    forEach((symbol) => {
      if (!this._subscribe(symbol)) {
        throw new Error(`Unable to add symbol: ${symbol}`);
      }
    }, symbols);
  }

  sync () {
    return this._symbols.toArray();
  }
  
  static start (options, done = NOOP) {
    ok(isObject(options), 'start: options is not an object');
    return async () => {
      const watch = new MarketWatch();
      // Register specific event handlers for session
      watch.on('session', (session) => {
        session.on('sync', (message) => {
          try {
            watch.update(message);
          } catch (err) {
            debug(`Error occured: ${err.message}`);
            return session.write(new ErrorMessage(err).pack());
          }
          debug('Sync update to all clients');
          // Broadcast sync messages made globally
          watch.broadcast(new SyncMessage(watch.sync()).pack());
        });
        // Sends initial sync message
        debug('new session registered - sending initial sync');
        session.write(new SyncMessage(watch.sync()).pack());
      });
      // Bind server
      watch.bind(options);
      // Finish
      await done();
    };
  }
}

module.exports = MarketWatch;
