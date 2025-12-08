/**
 * Burnout Prediction API Handlers
 *
 * Express handlers for calculating and retrieving caregiver burnout risk data.
 *
 * Uses Database class (pg Pool-based) from @folkcare/core.
 */

import type { Request, Response } from 'express';
import type { Database } from '@folkcare/core';
import { BurnoutService } from './service/burnout-service.js';
import type {
  CalculateBurnoutRiskRequest,
  GenerateBurnoutReportRequest,
  AnalysisPeriod,
} from './types/burnout.js';

function getUserContext(req: Request) {
  return {
    userId: req.header('X-User-Id') || (req as Request & { user?: { id: string } }).user?.id || 'system',
    organizationId:
      req.header('X-Organization-Id') ||
      (req as Request & { user?: { organizationId: string } }).user?.organizationId ||
      '',
    role:
      req.header('X-User-Role') ||
      (req as Request & { user?: { role: string } }).user?.role ||
      'caregiver',
  };
}

function handleError(error: unknown, res: Response, operation: string): void {
  if (error instanceof Error) {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: error.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function createBurnoutHandlers(db: Database) {
  const burnoutService = new BurnoutService(db);

  return {
    /**
     * GET /api/burnout/caregiver/:caregiverId/risk
     * Get current burnout risk for a specific caregiver
     */
    getCaregiverRisk: async (req: Request, res: Response): Promise<void> => {
      try {
        const caregiverId = req.params.caregiverId;
        if (!caregiverId) {
          res.status(400).json({ error: 'caregiverId parameter is required' });
          return;
        }

        const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';
        const context = getUserContext(req);

        const request: CalculateBurnoutRiskRequest = {
          caregiverId,
          analysisPeriod,
        };

        const risk = await burnoutService.calculateCaregiverBurnoutRisk(request, context);
        res.json(risk);
      } catch (error) {
        handleError(error, res, 'getting caregiver burnout risk');
      }
    },

    /**
     * GET /api/burnout/caregiver/:caregiverId/trend
     * Get historical burnout risk trend for a caregiver
     */
    getCaregiverTrend: async (req: Request, res: Response): Promise<void> => {
      try {
        const caregiverId = req.params.caregiverId;
        if (!caregiverId) {
          res.status(400).json({ error: 'caregiverId parameter is required' });
          return;
        }

        const weeksBack = parseInt(req.query.weeks as string) || 12;
        const context = getUserContext(req);

        const trend = await burnoutService.getCaregiverBurnoutTrend(
          caregiverId,
          context,
          weeksBack
        );

        res.json(trend);
      } catch (error) {
        handleError(error, res, 'getting caregiver burnout trend');
      }
    },

    /**
     * GET /api/burnout/organization/:organizationId/at-risk
     * Get list of caregivers at burnout risk in organization
     */
    getAtRiskCaregivers: async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId;
        if (!organizationId) {
          res.status(400).json({ error: 'organizationId parameter is required' });
          return;
        }

        const analysisPeriod = (req.query.period as AnalysisPeriod) || 'LAST_4_WEEKS';
        const context = getUserContext(req);

        const atRiskCaregivers = await burnoutService.getAtRiskCaregivers(
          organizationId,
          context,
          analysisPeriod
        );

        res.json(atRiskCaregivers);
      } catch (error) {
        handleError(error, res, 'getting at-risk caregivers');
      }
    },

    /**
     * POST /api/burnout/organization/:organizationId/report
     * Generate comprehensive burnout report for organization
     */
    generateOrganizationReport: async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId;
        if (!organizationId) {
          res.status(400).json({ error: 'organizationId parameter is required' });
          return;
        }

        const context = getUserContext(req);

        const request: GenerateBurnoutReportRequest = {
          organizationId,
          analysisPeriod: req.body.analysisPeriod || 'LAST_4_WEEKS',
          includeHealthy: req.body.includeHealthy || false,
        };

        const report = await burnoutService.generateOrganizationBurnoutReport(request, context);
        res.json(report);
      } catch (error) {
        handleError(error, res, 'generating burnout report');
      }
    },

    /**
     * POST /api/burnout/caregiver/:caregiverId/calculate
     * Manually trigger burnout risk calculation (admin/coordinator only)
     */
    calculateCaregiverRisk: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);

        // Permission check: only coordinator or admin
        if (!['coordinator', 'admin'].includes(context.role)) {
          res.status(403).json({ error: 'Permission denied' });
          return;
        }

        const caregiverId = req.params.caregiverId;
        if (!caregiverId) {
          res.status(400).json({ error: 'caregiverId parameter is required' });
          return;
        }

        const request: CalculateBurnoutRiskRequest = {
          caregiverId,
          analysisPeriod: req.body.analysisPeriod || 'LAST_4_WEEKS',
          config: req.body.config, // Optional custom config
        };

        const risk = await burnoutService.calculateCaregiverBurnoutRisk(request, context);
        res.json(risk);
      } catch (error) {
        handleError(error, res, 'calculating caregiver burnout risk');
      }
    },
  };
}

// Legacy export for backwards compatibility
export { createBurnoutHandlers as createBurnoutRoutes };
