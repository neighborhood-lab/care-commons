/**
 * Burnout Prediction API Routes
 *
 * REST endpoints for calculating and retrieving caregiver burnout risk data.
 */

import type { Router } from 'express';
import type { Knex } from 'knex';
import { BurnoutService } from './service/burnout-service.js';
import type {
  CalculateBurnoutRiskRequest,
  GenerateBurnoutReportRequest,
  AnalysisPeriod,
} from './types/burnout.js';

export function createBurnoutRoutes(router: Router, db: Knex): void {
  const burnoutService = new BurnoutService(db);

  /**
   * GET /api/burnout/caregiver/:caregiverId/risk
   * Get current burnout risk for a specific caregiver
   */
  router.get('/burnout/caregiver/:caregiverId/risk', async (req, res, next) => {
    try {
      const { caregiverId } = req.params;
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
  router.get('/burnout/caregiver/:caregiverId/trend', async (req, res, next) => {
    try {
      const { caregiverId } = req.params;
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
  router.get('/burnout/organization/:organizationId/at-risk', async (req, res, next) => {
    try {
      const { organizationId } = req.params;
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
  router.post('/burnout/organization/:organizationId/report', async (req, res, next) => {
    try {
      const { organizationId } = req.params;

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
  router.post('/burnout/caregiver/:caregiverId/calculate', async (req, res, next) => {
    try {
      // Permission check: only coordinator or admin
      if (!['coordinator', 'admin'].includes(req.user!.role)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const { caregiverId } = req.params;

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
