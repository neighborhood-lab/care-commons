/**
 * Missed Visit Alerts API Routes
 *
 * Coordinator-facing API for managing missed visit alerts.
 * Real-time monitoring and response to caregiver no-shows.
 */

import { Router } from 'express';
import { Database } from '@folkcare/core';
import { MissedVisitAlertService } from '../service/missed-visit-alert-service.js';

export function createMissedVisitAlertsRoutes(db: Database): Router {
  const router = Router();
  const alertService = new MissedVisitAlertService(db);

  /**
   * GET /api/scheduling/missed-visit-alerts
   * Get all active missed visit alerts for the organization
   */
  router.get('/', async (req, res, next) => {
    try {
      const { organizationId } = req.user as { organizationId: string };
      const { branchId } = req.query;

      const alerts = await alertService.getActiveAlerts(
        organizationId,
        branchId as string | undefined
      );

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/scheduling/missed-visit-alerts/detect
   * Manually trigger missed visit detection
   * (Normally runs via background job)
   */
  router.post('/detect', async (req, res, next) => {
    try {
      const { organizationId } = req.user as { organizationId: string };
      const { gracePeriodMinutes = 15 } = req.body;

      const alertsCreated = await alertService.detectMissedVisits(
        organizationId,
        gracePeriodMinutes
      );

      res.json({
        success: true,
        data: {
          alertsCreated,
          message: `Created ${alertsCreated} new missed visit alerts`
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/scheduling/missed-visit-alerts/:exceptionId/in-progress
   * Mark alert as being worked on by a coordinator
   */
  router.post('/:exceptionId/in-progress', async (req, res, next) => {
    try {
      const { exceptionId } = req.params;
      const { userId } = req.user as { userId: string };

      await alertService.markInProgress(exceptionId, userId);

      res.json({
        success: true,
        message: 'Alert marked as in progress'
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/scheduling/missed-visit-alerts/:exceptionId/resolve
   * Resolve an alert with a resolution note
   */
  router.post('/:exceptionId/resolve', async (req, res, next) => {
    try {
      const { exceptionId } = req.params;
      const { resolution } = req.body;
      const { userId } = req.user as { userId: string };

      if (!resolution || resolution.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Resolution note is required'
        });
        return;
      }

      await alertService.resolveAlert(exceptionId, resolution, userId);

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/scheduling/missed-visit-alerts/stats
   * Get statistics on missed visits for reporting
   */
  router.get('/stats', async (req, res, next) => {
    try {
      const { organizationId } = req.user as { organizationId: string };
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required'
        });
        return;
      }

      const stats = await alertService.getStats(
        organizationId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
