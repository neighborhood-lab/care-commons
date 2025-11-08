/**
 * Admin routes for system management and monitoring
 */

import { Router } from 'express';
import { getCacheService } from '@care-commons/core/service/cache.service';

const router = Router();

/**
 * Get cache statistics
 * Requires admin role
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    // TODO: Add authentication and authorization middleware
    // For now, this is a basic implementation
    const cache = getCacheService();

    // Check if using Redis or memory cache
    const cacheAsAny = cache as unknown as {
      redis?: {
        info: () => Promise<string>;
      };
      memoryCache?: Map<string, unknown>;
    };

    if (cacheAsAny.redis) {
      const info = await cacheAsAny.redis.info();

      // Parse Redis info (simplified)
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = value;
          }
        }
      }

      res.json({
        type: 'redis',
        info: stats,
      });
    } else {
      res.json({
        type: 'memory',
        size: cacheAsAny.memoryCache?.size || 0,
      });
    }
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * Clear cache
 * Requires admin role
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // TODO: Add authentication and authorization middleware
    const cache = getCacheService();
    const { pattern } = req.body as { pattern?: string };

    if (pattern !== undefined) {
      await cache.delPattern(pattern);
      res.json({ message: `Cleared cache for pattern: ${pattern}` });
    } else {
      // Clear all cache
      const cacheAsAny = cache as unknown as {
        redis?: {
          flushdb: () => Promise<string>;
        };
        memoryCache?: Map<string, unknown>;
      };

      if (cacheAsAny.redis) {
        await cacheAsAny.redis.flushdb();
      } else {
        cacheAsAny.memoryCache?.clear();
      }
      res.json({ message: 'Cleared all cache' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
