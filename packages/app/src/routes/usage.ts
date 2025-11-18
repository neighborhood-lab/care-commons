/**
 * Usage Statistics Routes
 * 
 * Provides real-time usage statistics for subscription limits
 */

import { Router, Request, Response } from 'express';
import { Database, AuthMiddleware, createUsageLimitMiddleware } from '@care-commons/core';

export function createUsageRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const usageLimitMiddleware = createUsageLimitMiddleware(db);

  /**
   * @openapi
   * /api/usage/stats:
   *   get:
   *     tags:
   *       - Usage
   *     summary: Get current usage statistics
   *     description: Returns current usage counts vs. subscription limits
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Usage statistics retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     clients:
   *                       type: object
   *                       properties:
   *                         current:
   *                           type: number
   *                         limit:
   *                           type: number
   *                           nullable: true
   *                     caregivers:
   *                       type: object
   *                       properties:
   *                         current:
   *                           type: number
   *                         limit:
   *                           type: number
   *                           nullable: true
   *                     visits:
   *                       type: object
   *                       properties:
   *                         current:
   *                           type: number
   *                         limit:
   *                           type: number
   *                           nullable: true
   *                     planName:
   *                       type: string
   *                     status:
   *                       type: string
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: No subscription found
   */
  router.get('/usage/stats', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId;
      
      const stats = await usageLimitMiddleware.getUsageStats(organizationId);
      
      if (stats === null) {
        res.status(404).json({
          success: false,
          error: 'No subscription found for organization',
        });
        return;
      }
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[Usage] Error fetching usage stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch usage statistics',
      });
    }
  });

  return router;
}
