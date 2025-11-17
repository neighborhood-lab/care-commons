/**
 * Clear Redis Cache
 * 
 * Clears all cached data from Redis. Useful after database resets.
 * 
 * Usage: npm run cache:clear
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config({ path: '.env', quiet: true });

async function clearCache() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('⚠️  No REDIS_URL configured. Cache is in-memory only (already cleared on restart).');
    process.exit(0);
  }

  console.log('🗑️  Clearing Redis cache...\n');

  const redis = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy(retries: number) {
        if (retries > 3) {
          console.error('❌ Failed to connect to Redis after 3 attempts');
          return new Error('Max retries reached');
        }
        return Math.min(retries * 50, 500);
      }
    }
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  try {
    await redis.connect();
    await redis.flushDb();
    console.log('✅ Redis cache cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

clearCache().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
