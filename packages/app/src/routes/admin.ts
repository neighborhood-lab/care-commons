/**
 * Admin routes for system management and monitoring
 *
 * SECURITY: These endpoints must have authentication/authorization added before production use
 */

import { Router } from 'express';
import { getCacheService } from '@care-commons/core/service/cache.service';

const router = Router();

/**
 * Get cache statistics
 *
 * @route GET /admin/cache/stats
 * @security Requires admin role (not yet implemented)
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    const cache = getCacheService();
    const stats = await cache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * Clear cache
 *
 * @route POST /admin/cache/clear
 * @security Requires admin role (not yet implemented)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const cache = getCacheService();
    const { pattern } = req.body as { pattern?: string };

    if (pattern !== undefined) {
      await cache.delPattern(pattern);
      res.json({ message: `Cleared cache for pattern: ${pattern}` });
    } else {
      await cache.clearAll();
      res.json({ message: 'Cleared all cache' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
