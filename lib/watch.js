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
const pEvent = require('p-event');

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
const { createRedisClient } = require('./cache');
const { MAX_WATCH_LIMIT } = require('./constants');

class MarketWatch extends Server {
  constructor (options = {}, defaultSymbols = ['TSLA']) {
    super(options);

    // this._redisClient = createRedisClient(options.storeUrl);
    this._symbols = new StrictStringSet(defaultSymbols);
    // Bind server
    this.bind(options);
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
    // this._redisClient.quit();
    super.shutdown();
  }

  update (symbols = []) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
    // At least one stock must be present
    if (!length(symbols)) {
      throw new RangeError('update: Invalid range: a single stock must be listed');
    }
    // Check if symbol length is valid
    if (length(symbols) > length(this._symbols)) {
      if(length(symbols) - length(this._symbols) > 1) {
        throw new RangeError('update: Invalid range: only a single update allowed');
      }
    } else if (length(symbols) < length(this._symbols)) {
      if (length(this._symbols) - length(symbols)) {
        throw new RangeError('update: Invalid range: only a single update allowed');
      }
    }
    // Clear existing symbol list
    this._symbols.clear();
    // Rebuild by subscribing to valid symbols
    forEach((symbol) => {
      if (!this._subscribe(symbol)) {
        throw new Error(`update: Unable to add symbol: ${symbol}`);
      }
    }, symbols);
  }

  sync () {
    return this._symbols.toArray();
  }
  
  static async start (options) {
    ok(isObject(options), 'start: options is not an object');
    
    const watch = new MarketWatch(options);
    // Register specific event handlers for session
    const sessionResult = await pEvent(watch, 'session');
    // Sends initial sync message
    debug('new session registered - sending initial sync');
    sessionResult.write(new SyncMessage(watch.sync()).pack());
    // Iterate all incoming events
    const syncMessageIterator = await pEvent.iterator(sessionResult, 'sync', {
      resolutionEvents: ['finish']
    });
    
    for await (const message of syncMessageIterator) {
      // Attempt to update message with store
      try {
        watch.update(message);
      } catch (err) {
        debug(`Error occured: ${err.message}`);
        return sessionResult.write(new ErrorMessage(err).pack());
      }

      debug('Sync update to all clients');
      // Broadcast sync messages made globally
      watch.broadcast(new SyncMessage(watch.sync()).pack());
    }
  }
}

module.exports = MarketWatch;
