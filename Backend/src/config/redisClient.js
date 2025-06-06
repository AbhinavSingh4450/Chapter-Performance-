// const {Redis}=require('ioredis');
// const client=new Redis(process.env.REDIS_URL);
// require('dotenv').config();

// module.exports=client;


// redisClient.js (for general caching)
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
module.exports = client;

// ioredisClient.js (for rate limiting)
const Redis = require('ioredis');
const ioredisClient = new Redis(process.env.REDIS_URL);
module.exports = ioredisClient;


