import Redis from 'redis';

let redisClient: Redis.RedisClientType | null = null;

export const initRedis = async (): Promise<Redis.RedisClientType | null> => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined || redisUrl === '') {
    console.log('Redis not configured, using in-memory rate limiting');
    return null;
  }

  try {
    redisClient = Redis.createClient({ url: process.env.REDIS_URL });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
};

export const getRedisClient = (): Redis.RedisClientType | null => redisClient;
