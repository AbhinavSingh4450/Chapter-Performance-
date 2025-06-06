const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis'); // ✅ fix import
const redisClient = require('../config/redisClient'); // ioredis instance

let store;
try {
  store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
} catch (err) {
  console.error('Error initializing Redis rate limit store:', err.message);
  store = undefined; // fallback to in-memory
}

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  ...(store && { store }),
});

module.exports = limiter;
