import { getRedisClient } from '../config/redis';

interface RateLimitStats {
  general: number;
  auth: number;
  evv: number;
  sync: number;
  reports: number;
}

export class MetricsService {
  static async getRateLimitStats(): Promise<RateLimitStats | null> {
    const redis = getRedisClient();
    if (redis === null) return null;

    const keys = await redis.keys('rl:*');
    const stats = {
      general: 0,
      auth: 0,
      evv: 0,
      sync: 0,
      reports: 0,
    };

    for (const key of keys) {
      if (key.startsWith('rl:general:')) stats.general++;
      else if (key.startsWith('rl:auth:')) stats.auth++;
      else if (key.startsWith('rl:evv:')) stats.evv++;
      else if (key.startsWith('rl:sync:')) stats.sync++;
      else if (key.startsWith('rl:reports:')) stats.reports++;
    }

    return stats;
  }
}
