// const {createClient}=require('redis');

// exports.connectionRedis=async()=>{
//     const redisClient=await createClient({
//         url: process.env.REDIS_URL

//     })
//     .on('error', (err) => console.error('Redis Client Error', err))
//     .on('connect', () => console.log('Redis Client Connected h'))
//     .connect();

//     return redisClient;
// }


const { createClient } = require('redis');

let redisClient;

const connectionRedis = async () => {
  if (redisClient) return redisClient; // reuse if already connected

  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  await redisClient.connect();

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not connected yet. Call connectionRedis() first.');
  }
  return redisClient;
};

module.exports = {
  connectionRedis,
  getRedisClient,
};
