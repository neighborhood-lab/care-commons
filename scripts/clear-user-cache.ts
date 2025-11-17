/**
 * Clear specific user cache by email
 * 
 * Usage: tsx scripts/clear-user-cache.ts admin@carecommons.example
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config({ path: '.env', quiet: true });

async function clearUserCache(email: string) {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('⚠️  No REDIS_URL configured. Cache is in-memory only.');
    process.exit(0);
  }

  console.log(`🗑️  Clearing cache for user: ${email}\n`);

  const redis = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy(retries: number) {
        if (retries > 3) {
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
    
    const cacheKey = `user:email:${email}`;
    const result = await redis.del(cacheKey);
    
    if (result > 0) {
      console.log(`✅ Deleted cache key: ${cacheKey}\n`);
    } else {
      console.log(`⚠️  Cache key not found: ${cacheKey}\n`);
    }
    
    // Also check for any pattern matches
    const keys = await redis.keys(`user:email:${email}*`);
    console.log('Related keys found:', keys.length ? keys : 'none');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx scripts/clear-user-cache.ts <email>');
  process.exit(1);
}

clearUserCache(email).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
