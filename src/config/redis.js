const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, falling back to memory store');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  }
  return redisClient;
};

module.exports = { getRedisClient };
