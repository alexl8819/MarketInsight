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
const pEvent = require('p-event');
const debug = require('debug')('store');

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
  isNumber,
  isObject,
  isStringArray,
  SortedStringSet
} = require('./util');
const { 
  REDIS_KEY,
  MAX_WATCH_LIMIT,
  DEFAULT_STORE_SYMBOLS
} = require('./constants');
const { createRedisClient } = require('./cache');

class MarketWatch extends Server {
  constructor (options = {}) {
    super(options);
  }

  async _subscribe (symbol) {
    throw new Error('subscribe: Method not implemented');
  }

  async update (symbols) {
    throw new Error('update: Method not implemented')
  }

  async sync () {
    throw new Error('sync: Method not implemented');
  }

  async setup () {
    throw new Error('setup: Method not implemented');
  }

  async stop (force) {
    if (force) {
      const shutdownPromise = super.shutdown();
      await shutdownPromise;
    }
  }
  
  static async init (store) {
    // Setup store
    const setupPromise = store.setup();
    await setupPromise;
    // Register specific event handlers for session
    const sessionIteratorPromise = pEvent.iterator(store, 'session', {
      rejectionEvents: [],
      resolutionEvents: ['finish']
    });
    const sessionIterator = await sessionIteratorPromise;
    // Iterate over all incoming sessions
    for await (const session of sessionIterator) {
      // Sends initial sync message
      debug('new session registered - sending initial sync');
      const initialSymbolsPromise = store.sync();
      const initialSymbols = await initialSymbolsPromise;
      debug('Waiting for incoming events...');
      // Iterate all incoming events
      session.on('sync', async (message) => {
        try {
          const updatePromise = store.update(message);
          await updatePromise;
        } catch (err) {
          debug(`Error occured: ${err.message}`);
          return session.write(new ErrorMessage(err).pack());
        }

        // Broadcast sync messages made globally
        debug('Sync update to all clients');
        const symbolsPromise = store.sync();
        const symbols = await symbolsPromise;
        store.broadcast(new SyncMessage(symbols).pack());
      });

      session.write(new SyncMessage(initialSymbols).pack());
    }
    // If events have finished, stop and shutdown
    debug('Attempting to shut down store and server');

    try {
      const stopPromise = store.stop();
      await stopPromise;
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

// Utilizes a specialized data structure for development only purposes
class BasicMarketWatchStore extends MarketWatch {
  constructor (options) {
    super(options);

    this._symbols = new SortedStringSet();
  }

  async _subscribe (symbol) {
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
  
  async update (symbols) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
    // Check if symbol length is valid
    const diff = difference(symbols, this._symbols.toArray());
    // Throw error if more than a single change was detected
    if (length(diff) > 1) {
      throw new RangeError('Invalid range - only a single stock can be added at a time');
    }
    // Rebuild by subscribing to valid symbols
    await this.setup(symbols);
  }

  async sync () {
    // Resolve immediately
    return this._symbols.toArray();
  }

  async setup (symbols = DEFAULT_STORE_SYMBOLS) {
    // Clear existing symbol list
    this._symbols.clear();
    // Subscribe to all symbols
    forEach((symbol) => {
      if (!this._subscribe(symbol)) {
        throw new Error(`Unable to add symbol: ${symbol}`);
      }
    }, symbols);
  }

  async stop (force) {
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
  constructor (options) {
    super(options);
    
    this._redisClient = createRedisClient(options.storeUrl);
  }

  static get _REDIS_SYMBOLS_KEY() {
    return `${REDIS_KEY}_symbols`;
  }

  async _subscribe (symbol) {
    ok(isString(symbol), 'symbol is not a string');
    
    const normalizedSymbol = toUpper(trim(symbol));
    
    if (!contains(normalizedSymbol, tradeableSymbols.current)) {
      return false;
    }
    
    // Retrieve current size of set
    const sizeResultPromise = this._redisClient.zcard(this._REDIS_SYMBOLS_KEY);
    const sizeResult = await sizeResultPromise;

    if (sizeResult > MAX_WATCH_LIMIT) {
      return false;
    }
    
    // Add member to set
    const addMemberResultPromise = this._redisClient.zadd(this._REDIS_SYMBOLS_KEY, 1, normalizedSymbol);
    const addMemberResult = await addMemberResultPromise;
    return isNumber(addMemberResult) && addMemberResult === 1;
  }

  async update (symbols) {
    ok((Array.isArray(symbols) && isStringArray(symbols)), 'symbols is not a string array');
    // We only want N results to set limitation, -1 would include ALL
    const symbolsResultPromise = this._redisClient.zrange(this._REDIS_SYMBOLS_KEY, 0, MAX_WATCH_LIMIT);
    const symbolsResult = await symbolsResultPromise;
    // TODO:
    const diff = difference(symbols, symbolsResult);
    // TODO:
    if (length(diff) > 1) {
      throw new Error('Invalid range: only a single stock can be added at a time');
    } 
    // Clear existing symbols and add symbols
    const setupPromise = this.setup(symbols);
    await setupPromise;
  }

  async sync () {
    // Fetch N results up to set limitation, -1 would include ALL
    const symbolsResultPromise = this._redisClient.zrange(this._REDIS_SYMBOLS_KEY, 0, MAX_WATCH_LIMIT);
    const symbolsResult = await symbolsResultPromise;
    return symbolsResult;
  }

  async setup (symbols = DEFAULT_STORE_SYMBOLS) {
    // Make sure client is connected first
    try {
      const connectPromise = this._redisClient.connect();
      await connectPromise;
      debug('Redis client connected');
    } catch (err) {
      debug(err);
    }
    // Remove all current entries
    const removeAllPromise = this._redisClient.del(this._REDIS_SYMBOLS_KEY);
    const removeAll = await removeAllPromise;
    // Validate removeAll worked
    if (!isNumber(removeAll) || removeAll !== 1) {
      throw new Error('Failed to delete symbols key');
    }
    // Add default symbols if provided
    for (const symbol of symbols) {
      const subscribedPromise = this._subscribe(symbol);
      const subscribed = await subscribedPromise;
      
      if (!subscribed) {
        throw new Error(`Unable to add symbol: ${symbol}`);
      }
    }
  }

  async stop (force) {
    await this._redisClient.quit();
    super.stop(force);
  }

  static async start (options) {
    ok(isObject(options), 'start: options is not an object');
    // Initialize new instance
    MarketWatch.init(new RedisMarketWatchStore(options));
  }
}

module.exports = {
  BasicMarketWatchStore,
  RedisMarketWatchStore
};
