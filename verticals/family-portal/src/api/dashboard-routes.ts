/**
 * Family Portal Dashboard Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { DashboardService } from '../service/index.js';

export function createDashboardRoutes(dashboardService: DashboardService): Router {
  const router = Router();

  /**
   * GET /api/family-portal/dashboard
   * Get complete dashboard data
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const dashboard = await dashboardService.getDashboard(familyMember);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
