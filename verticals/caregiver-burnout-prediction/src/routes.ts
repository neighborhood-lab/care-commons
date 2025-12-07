/**
 * Burnout Prediction API Routes
 *
 * REST endpoints for calculating and retrieving caregiver burnout risk data.
 */

import type { Router, Request } from 'express';
import type { Knex } from 'knex';
import { BurnoutService } from './service/burnout-service.js';
import type {
  CalculateBurnoutRiskRequest,
  GenerateBurnoutReportRequest,
  AnalysisPeriod,
} from './types/burnout.js';

// Authenticated request with user context
interface AuthenticatedRequest extends Request<any, any, any, any> {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

export function createBurnoutRoutes(router: Router, db: Knex): void {
  const burnoutService = new BurnoutService(db);

  /**
   * GET /api/burnout/caregiver/:caregiverId/risk
   * Get current burnout risk for a specific caregiver
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/burnout/caregiver/:caregiverId/risk', async (req: AuthenticatedRequest, res, next) => {
    try {
      const caregiverId = req.params.caregiverId!;
      const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';

      const context = {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        role: req.user!.role,
      };

      const request: CalculateBurnoutRiskRequest = {
        caregiverId,
        analysisPeriod,
      };

      const risk = await burnoutService.calculateCaregiverBurnoutRisk(request, context);

      res.json(risk);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/burnout/caregiver/:caregiverId/trend
   * Get historical burnout risk trend for a caregiver
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/burnout/caregiver/:caregiverId/trend', async (req: AuthenticatedRequest, res, next) => {
    try {
      const caregiverId = req.params.caregiverId!;
      const weeksBack = parseInt(req.query.weeks as string) || 12;

      const context = {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        role: req.user!.role,
      };

      const trend = await burnoutService.getCaregiverBurnoutTrend(
        caregiverId,
        context,
        weeksBack
      );

      res.json(trend);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/burnout/organization/:organizationId/at-risk
   * Get list of caregivers at burnout risk in organization
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/burnout/organization/:organizationId/at-risk', async (req: AuthenticatedRequest, res, next) => {
    try {
      const organizationId = req.params.organizationId!;
      const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';

      const context = {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        role: req.user!.role,
      };

      const atRiskCaregivers = await burnoutService.getAtRiskCaregivers(
        organizationId,
        context,
        analysisPeriod
      );

      res.json(atRiskCaregivers);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/burnout/organization/:organizationId/report
   * Generate comprehensive burnout report for organization
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/burnout/organization/:organizationId/report', async (req: AuthenticatedRequest, res, next) => {
    try {
      const organizationId = req.params.organizationId!;

      const context = {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        role: req.user!.role,
      };

      const request: GenerateBurnoutReportRequest = {
        organizationId,
        analysisPeriod: req.body.analysisPeriod || 'LAST_4_WEEKS',
        includeHealthy: req.body.includeHealthy || false,
      };

      const report = await burnoutService.generateOrganizationBurnoutReport(request, context);

      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/burnout/caregiver/:caregiverId/calculate
   * Manually trigger burnout risk calculation (admin/coordinator only)
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/burnout/caregiver/:caregiverId/calculate', async (req: AuthenticatedRequest, res, next) => {
    try {
      // Permission check: only coordinator or admin
      if (!['coordinator', 'admin'].includes(req.user!.role)) {
        res.status(403).json({ error: 'Permission denied' });
        return;
      }

      const caregiverId = req.params.caregiverId!;

      const context = {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        role: req.user!.role,
      };

      const request: CalculateBurnoutRiskRequest = {
        caregiverId,
        analysisPeriod: req.body.analysisPeriod || 'LAST_4_WEEKS',
        config: req.body.config, // Optional custom config
      };

      const risk = await burnoutService.calculateCaregiverBurnoutRisk(request, context);

      res.json(risk);
    } catch (error) {
      next(error);
    }
  });
}
