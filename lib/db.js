const Redis = require('ioredis');

const createRedisClient = (connectionOpts) => new Redis({
  lazyConnect: true,
  ...connectionOpts
});

module.exports = {
  createRedisClient
};
