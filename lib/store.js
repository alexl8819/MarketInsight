/**
 * lib/watch.js - Market watch synchronization stores
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
const Bottleneck = require('bottleneck');
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
  equals,
  trim,
  toUpper,
  isString,
  isNumber,
  isObject,
  isStringArray,
  isEmpty,
  SortedStringSet
} = require('./util');
const { 
  APP_NAME,
  APP_VERSION,
  REDIS_KEY,
  MAX_WATCH_LIMIT,
  DEFAULT_STORE_SYMBOLS,
  MINIMUM_TIME_PER_REQUEST
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
  
  static async init (queue, store) {
    queue.on('error', (err) => debug(err));
    queue.on('failed', () => debug('job failed'));
    queue.on('dropped', (dropped) => debug(`dropped req: ${dropped}`));
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
      session.on('sync', (message) => queue.schedule(async () => {
        try {
          const updatePromise = store.update(message);
          await updatePromise;
          debug('Successfully updated store');
        } catch (err) {
          debug(`Error occured: ${err.message}`);
          return session.write(new ErrorMessage(err).pack());
        }
        // Sync
        debug('Sync update to all clients');
        const symbolsPromise = store.sync();
        const symbols = await symbolsPromise;
        // Broadcast to all sessions
        store.broadcast(new SyncMessage(symbols).pack());
      }));

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
    // Normalize symbol
    const normalizedSymbol = toUpper(trim(symbol));
    // Fail if symbol does not exist
    if (!contains(normalizedSymbol, tradeableSymbols.current)) {
      return false;
    }
    // Fail if size of set is larger than limit
    if (this._symbols.size > MAX_WATCH_LIMIT) {
      return false;
    }
    // Validate success
    return isObject(this._symbols.add(normalizedSymbol));
  }
  
  async update (symbols) {
    ok(isStringArray(symbols), 'symbols is not a string array');
    // Do nothing if sets are the same
    if (equals(symbols, this._symbols.toArray())) {
      return;
    }
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

  async setup (symbols = []) { // DEFAULT_STORE_SYMBOLS
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

  static async start (options) {
    ok(isObject(options), 'start: options is not an object');
    // Initialize new instance
    await MarketWatch.init(
      new Bottleneck({
        strategy: Bottleneck.strategy.OVERFLOW,
        maxConcurrent: 1,
        highWater: 1,
        minTime: MINIMUM_TIME_PER_REQUEST,
        id: `${APP_NAME}_${APP_VERSION}`    
      }), 
      new BasicMarketWatchStore(options)
    );
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
    // Normalize symbol
    const normalizedSymbol = toUpper(trim(symbol));
    // Validate symbol actually exists
    if (!contains(normalizedSymbol, tradeableSymbols.current)) {
      return false;
    }
    // Add member to set
    const addMemberResultPromise = this._redisClient.zadd(this._REDIS_SYMBOLS_KEY, 1, normalizedSymbol);
    const addMemberResult = await addMemberResultPromise;
    // Validate command success
    return isNumber(addMemberResult) && addMemberResult === 1;
  }

  async _unsubscribe (symbol) {
    ok(isString(symbol), 'symbol is not a string');
    // Normalize symbol
    const normalizedSymbol = toUpper(trim(symbol));
      // Remove member from set
    const removeMemberPromise = this._redisClient.zrem(this._REDIS_SYMBOLS_KEY, normalizedSymbol);
    const removedMemberResult = await removeMemberPromise;
    // Validate command success
    return isNumber(removedMemberResult) && removedMemberResult === 1;
  }
  
  async update (symbols) {
    ok(isStringArray(symbols), 'symbols is not a string array');
    // We only want N results to set limitation, -1 would include ALL
    const symbolsResultPromise = this._redisClient.zrange(this._REDIS_SYMBOLS_KEY, 0, MAX_WATCH_LIMIT);
    const symbolsResult = await symbolsResultPromise;
    // Do nothing when no changes are required
    if (equals(symbols, symbolsResult)) {
      return;
    }
    // Prevent adding more symbols if it exceeds maximum size
    if ((length(symbols) > length(symbolsResult)) 
      && (length(symbolsResult) >= MAX_WATCH_LIMIT)) {
      throw new Error('Unable to add new symbols. Maximum limit has been reached.') 
    }
    debug(`Previous State Symbols: ${symbolsResult}`);
    debug(`Current State Symbols: ${symbols}`);
    // Remove or add depending on lists
    if (length(symbols) > length(symbolsResult)) {
      const diff = difference(symbols, symbolsResult);
      // Diff against both lists to make sure only a single add occurs
      if (length(diff) > 1) {
        throw new Error('Invalid range: only a single stock can be added at a time');
      }
      // Subscribe to new symbol
      const subscribePromise = this._subscribe(diff[0]);
      const subscribed = await subscribePromise;
      // Notify failure status
      if (!subscribed) {
        throw new Error(`Failed to subscribe to ${diff[0]}`);
      }
      debug(`Successfully subscribed to ${diff[0]}`);
    } else {
      const diff = difference(symbolsResult, symbols);
      // Diff against both lists to make sure only a single remove occurs
      if (length(diff) > 1) {
        throw new Error('Invalid range: only a single stock can be removed at a time');
      }
      // Remove symbol subscription
      const unsubscribePromise = this._unsubscribe(diff[0]);
      const unsubscribed = await unsubscribePromise;
      // Notify failure status
      if (!unsubscribed) {
        throw new Error(`Failed to unsubscribe from ${diff[0]}`);
      }
      debug(`Successfully unsubscribed from ${diff[0]}`);
    }
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
    if (!isNumber(removeAll)) {
      throw new Error('Failed to delete symbols key');
    }
    debug('Successfully deleted existing set');
    // Add default symbols if provided
    for (const symbol of symbols) {
      const subscribedPromise = this._subscribe(symbol);
      const subscribed = await subscribedPromise;
      // Notify failure of symbols that weren't added    
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
    const initializePromise = MarketWatch.init(
      new Bottleneck({
        strategy: Bottleneck.strategy.OVERFLOW,
        maxConcurrent: 1,
        highWater: 1,
        minTime: MINIMUM_TIME_PER_REQUEST,
        id: `${APP_NAME}_${APP_VERSION}`,
        datastore: 'ioredis',
        clearDatastore: true
      }), 
      new RedisMarketWatchStore(options)
    );
    await initializePromise;
  }
}

module.exports = {
  BasicMarketWatchStore,
  RedisMarketWatchStore
};
