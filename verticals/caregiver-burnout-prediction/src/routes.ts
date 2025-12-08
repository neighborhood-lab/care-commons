/**
 * Burnout Prediction API Routes
 *
 * REST endpoints for calculating and retrieving caregiver burnout risk data.
 */

import type { Router, Request, Response, NextFunction } from 'express';
import type { Database, TokenPayload } from '@folkcare/core';
import { BurnoutService } from './service/burnout-service.js';
import type {
  CalculateBurnoutRiskRequest,
  GenerateBurnoutReportRequest,
  AnalysisPeriod,
} from './types/burnout.js';

// Authenticated request with user context
interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Helper type for request body
interface ReportRequestBody {
  analysisPeriod?: AnalysisPeriod;
  includeHealthy?: boolean;
  config?: Record<string, unknown>;
}

export function createBurnoutRoutes(router: Router, db: Database): void {
  const burnoutService = new BurnoutService(db);

  /**
   * GET /api/burnout/caregiver/:caregiverId/risk
   * Get current burnout risk for a specific caregiver
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/burnout/caregiver/:caregiverId/risk', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const caregiverId = req.params.caregiverId as string;
      const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';

      const context = {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        role: req.user!.roles[0] || 'caregiver',
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
  router.get('/burnout/caregiver/:caregiverId/trend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const caregiverId = req.params.caregiverId as string;
      const weeksBack = parseInt(req.query.weeks as string) || 12;

      const context = {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        role: req.user!.roles[0] || 'caregiver',
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
  router.get('/burnout/organization/:organizationId/at-risk', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.organizationId as string;
      const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';

      const context = {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        role: req.user!.roles[0] || 'caregiver',
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
  router.post('/burnout/organization/:organizationId/report', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.organizationId as string;
      const body = req.body as ReportRequestBody;

      const context = {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        role: req.user!.roles[0] || 'caregiver',
      };

      const request: GenerateBurnoutReportRequest = {
        organizationId,
        analysisPeriod: body.analysisPeriod || 'LAST_4_WEEKS',
        includeHealthy: body.includeHealthy || false,
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
  router.post('/burnout/caregiver/:caregiverId/calculate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Permission check: only coordinator or admin
      const userRole = req.user!.roles[0] || '';
      if (!['coordinator', 'admin'].includes(userRole)) {
        res.status(403).json({ error: 'Permission denied' });
        return;
      }

      const caregiverId = req.params.caregiverId as string;
      const body = req.body as ReportRequestBody;

      const context = {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        role: userRole,
      };

      const request: CalculateBurnoutRiskRequest = {
        caregiverId,
        analysisPeriod: body.analysisPeriod || 'LAST_4_WEEKS',
        config: body.config, // Optional custom config
      };

      const risk = await burnoutService.calculateCaregiverBurnoutRisk(request, context);

      res.json(risk);
    } catch (error) {
      next(error);
    }
  });
}
