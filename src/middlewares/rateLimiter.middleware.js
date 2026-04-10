const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

const createRateLimiter = (options = {}) => {
  const limiterOptions = {
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.originalUrl,
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) || 15,
      });
    },
    ...options,
  };

  // Try to use Redis store
  try {
    const redisClient = getRedisClient();
    limiterOptions.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
    logger.info('Rate limiter using Redis store');
  } catch (err) {
    logger.warn('Redis unavailable, using memory store for rate limiting');
  }

  return rateLimit(limiterOptions);
};

// Login rate limiter: 10 attempts per 15 min
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

// Refresh token rate limiter: 20 requests per 15 min
const refreshTokenRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

module.exports = { loginRateLimiter, refreshTokenRateLimiter };
