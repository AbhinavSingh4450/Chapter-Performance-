const { Redis } = require('ioredis');
require('dotenv').config()


// Get Redis URL from environment variables
const redisUrl = process.env.REDIS_URL;

// Create Redis client using the URL
const redisClient = new Redis(redisUrl);

module.exports = redisClient;

