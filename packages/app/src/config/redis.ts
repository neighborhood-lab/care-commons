import Redis from 'redis';

let redisClient: Redis.RedisClientType | null = null;

/**
 * Initialize Redis client for general use
 * Supports both local Redis and Upstash Redis (TLS)
 */
export const initRedis = async (): Promise<Redis.RedisClientType | null> => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined || redisUrl === '') {
    console.log('Redis not configured, using in-memory fallback');
    return null;
  }

  try {
    // Determine if TLS is required based on URL protocol
    // Upstash uses rediss:// for TLS connections
    const useTLS = redisUrl.startsWith('rediss://');

    const clientOptions: Redis.RedisClientOptions = {
      url: redisUrl,
    };

    // Enable TLS for Upstash and other cloud Redis providers
    if (useTLS) {
      clientOptions.socket = {
        tls: true,
        // Disable certificate verification for Vercel deployments
        // (Vercel's serverless functions may have issues with cert chains)
        rejectUnauthorized: false,
      };
    }

    redisClient = Redis.createClient(clientOptions);

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      console.log(`Redis connected successfully (TLS: ${useTLS})`);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    await redisClient.connect();
    console.log('Redis connection established');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('Continuing without Redis - rate limiting will use in-memory store');
    return null;
  }
};

export const getRedisClient = (): Redis.RedisClientType | null => redisClient;
