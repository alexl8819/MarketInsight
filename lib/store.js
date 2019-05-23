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
  difference,
  contains,
  trim,
  toUpper,
  isString,
  isObject,
  isStringArray,
  SortedStringSet
} = require('./util');
const { createRedisClient } = require('./cache');
const { 
  REDIS_KEY, 
  MAX_WATCH_LIMIT 
} = require('./constants');

class MarketWatch extends Server {
  constructor (options = {}) {
    super(options);
  }

  _subscribe (symbol) {
    throw new Error('_subscribe: Method not implemented');
  }

  async update (symbols) {
    throw new Error('update: Method not implemented')
  }

  async sync () {
    throw new Error('sync: Method not implemented');
  }

  stop (force) {
    if (force) {
      super.shutdown();
    }
  }
  
  static async init (store) {
    // Wait for ready event
    // const _ = await pEvent(store, 'ready');
    // Register specific event handlers for session
    const sessionResult = await pEvent(store, 'session');
    // Sends initial sync message
    debug('new session registered - sending initial sync');
    const initialSymbols = await store.sync();
    sessionResult.write(new SyncMessage(initialSymbols).pack());
    // Iterate all incoming events
    const syncMessageIterator = await pEvent.iterator(sessionResult, 'sync', {
      resolutionEvents: ['finish']
    });
    
    for await (const message of syncMessageIterator) {
      // Attempt to update message with store
      try {
        await store.update(message);
      } catch (err) {
        debug(`Error occured: ${err.message}`);
        return sessionResult.write(new ErrorMessage(err).pack());
      }

      debug('Sync update to all clients');
      // Broadcast sync messages made globally
      const symbols = await store.sync();
      store.broadcast(new SyncMessage(symbols).pack());
    }
    
    // If events have finished, stop and shutdown
    store.stop();
  }
}

// Utilizes a specialized data structure for development only purposes
class BasicMarketWatchStore extends MarketWatch {
  constructor (options, defaultSymbols = ['TSLA']) {
    super(options);
    this._symbols = new SortedStringSet(defaultSymbols);
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
  
  async update (symbols = []) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
    // At least one stock must be present
    if (!length(symbols)) {
      throw new RangeError('update: Invalid range: a single stock must be listed');
    }
    // Check if symbol length is valid
    const diff = difference(symbols, this._symbols.toArray());
    // Throw error if more than a single change was detected
    if (length(diff) > 1) {
      throw new RangeError('update: Invalid range - only a single updated allowed');
    }
    // Clear existing symbol list
    this._symbols.clear();
    // Rebuild by subscribing to valid symbols
    forEach((symbol) => {
      if (!this._subscribe(symbol)) {
        throw new Error(`update: Unable to add symbol: ${symbol}`);
      }
    }, symbols);
    return Promise.resolve();
  }

  async sync () {
    // Resolve immediately
    return Promise.resolve(this._symbols.toArray());
  }

  stop (force) {
    this._symbols.clear();
    super.stop(force);
  }

  static start (options) {
    ok(isObject(options), 'start: options is not an object');
    // Initialize new instance
    MarketWatch.init(new BasicMarketWatchStore(options));
  }
}

class RedisMarketWatchStore extends MarketWatch {
  constructor (options, defaultSymbols = ['TSLA']) {
    super(options); 
    this._redisClient = createRedisClient(options.storeUrl);
  }

  async _subscribe (symbol) {
    ok(isString(symbol), 'symbol is not a string');

  ¦ const normalizedSymbol = toUpper(trim(symbol));

  ¦ if (!contains(normalizedSymbol, tradeableSymbols.current)) {
  ¦ ¦ return false;
  ¦ }
    
    // Retrieve current size of set
    const sizeResult = await this._redisClient.zcard(`${REDIS_KEY}_symbols`);

    if (sizeResult > MAX_WATCH_LIMIT) {
      return false;
    }

    // await this._redisClient.zadd();
  }

  async update (symbols = []) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
  ¦ // At least one stock must be present
  ¦ if (!length(symbols)) {
  ¦ ¦ throw new RangeError('update: Invalid range: a single stock must be listed');
  ¦ }
    
    const symbolsResult = await this._redisClient.zrange(`${REDIS_KEY}_symbols`, 0, MAX_WATCH_LIMIT);
    const diff = ;
  }

  async sync () {
    const symbolsResult = await this._redisClient.zrange(`${REDIS_KEY}_symbols`, 0, -1);
    return symbolsResult;
  }

  async stop (force) {
    const _ = await this._redisClient.quit();
    super.stop(force);
  }

  static start (options) {
    ok(isObject(options), 'start: options is not an object');
    // Initialize new instance
    MarketWatch.init(new RedisMarketWatchStore(options));
  }
}

module.exports = {
  BasicMarketWatchStore,
  RedisMarketWatchStore
};
