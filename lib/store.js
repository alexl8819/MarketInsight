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
  
  delete () {
    throw new Error('delete: Method not implemented');
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

  delete (key) {
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

    return this._redisClient.zrange(key, start, end);
  }
}

module.exports = {
  RedisDataStoreAdapter,
  createRedisClient
};
