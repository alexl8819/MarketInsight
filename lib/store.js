/**
 * lib/store.js - Data store-specific adapters
 * Copyright (C) 2018 alexl8819
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
const Redis = require('ioredis');

const { DEFAULT_REDIS_CONFIGURATION } = require('./constants');

const createRedisClient = () => new Redis(
  Object.assign({}, DEFAULT_REDIS_CONFIGURATION, {
    lazyConnect: true
  }
));

class DataStoreAdapter {
  open () {
    throw new Error('open: Method not implemented');
  }

  close () {
    throw new Error('close: Method not implemented');
  }
  
  drop () {
    throw new Error('drop: Method not implemented');
  }

  addToSet () {
    throw new Error('addToSet: Method not implemented');
  }

  removeFromSet () {
    throw new Error('removeFromSet: Method not implemented');
  }

  iterateSet () {
    throw new Error('iterateSet: Method not implemented');
  }
}

class RedisDataStoreAdapter extends DataStoreAdapter {
  constructor (client) {
    super();

    this._client = client || createRedisClient()
  }

  open () {
    // client should be autoconnected if lazy connect is not passed
    return this._client.lazyConnect ? this._client.connect() : Promise.resolve();
  }

  close () {
    return this._client.quit();
  }

  drop (key) {
    ok(typeof key === 'string', 'Key must be a string');
    
    return this._client.del(key);
  }

  addToSet (key, value) {
    ok(typeof key === 'string', 'Key must be a string');
    ok(typeof value === 'string', 'Value must be a string');
    
    return this._client.zadd(key, 1, value);
  }

  removeFromSet (key, value) {
    ok(typeof key === 'string', 'Key must be a string');
    ok(typeof value === 'string', 'Value must be a string');
    
    return this._client.zrem(key, value);
  }

  iterateSet (key, start, end) {
    ok(typeof key === 'string', 'Key must be a string');
    ok(typeof start === 'number', 'Start must be a number');
    ok(typeof end === 'number', 'End must be a number');

    return this._client.zrange(key, start, end);
  }
}

module.exports = {
  RedisDataStoreAdapter,
  createRedisClient
};
