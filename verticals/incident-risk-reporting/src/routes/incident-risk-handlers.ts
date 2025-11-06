/**
 * @care-commons/incident-risk-reporting - HTTP Request Handlers
 *
 * Express route handlers for incident and risk reporting endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import type { IncidentRiskService } from '../services/incident-risk-service.js';
import type { UserContext } from '@care-commons/core';

/**
 * Create incident and risk reporting route handlers
 */
export function createIncidentRiskHandlers(service: IncidentRiskService) {
  return {
    // ============================================================================
    // Incident Report Endpoints
    // ============================================================================

    /**
     * POST /api/incidents
     * Create a new incident report
     */
    async createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const incident = await service.reportIncident(req.body, context);
        res.status(201).json(incident);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/incidents/:id
     * Get incident report by ID
     */
    async getIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const incident = await service.getIncidentReport(req.params.id, context);
        if (!incident) {
          res.status(404).json({ error: 'Incident not found' });
          return;
        }
        res.json(incident);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /api/incidents/:id
     * Update incident report
     */
    async updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const incident = await service.updateIncidentReport(req.params.id, req.body, context);
        res.json(incident);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/incidents/:id/close
     * Close incident report
     */
    async closeIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const { closureNotes } = req.body;
        const incident = await service.closeIncident(req.params.id, closureNotes, context);
        res.json(incident);
      } catch (error) {
        next(error);
      }
    },

    // ============================================================================
    // Risk Assessment Endpoints
    // ============================================================================

    /**
     * POST /api/risk-assessments
     * Create a new risk assessment
     */
    async createRiskAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const assessment = await service.createRiskAssessment(req.body, context);
        res.status(201).json(assessment);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/clients/:clientId/risk-assessments/active
     * Get active risk assessments for a client
     */
    async getClientRisks(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const assessments = await service.getClientActiveRisks(req.params.clientId, context);
        res.json(assessments);
      } catch (error) {
        next(error);
      }
    },

    // ============================================================================
    // Investigation Endpoints
    // ============================================================================

    /**
     * POST /api/investigations
     * Start a new investigation
     */
    async startInvestigation(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const investigation = await service.startInvestigation(req.body, context);
        res.status(201).json(investigation);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/investigations/:id/complete
     * Complete an investigation
     */
    async completeInvestigation(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const { findings, outcome, recommendations } = req.body;
        const investigation = await service.completeInvestigation(
          req.params.id,
          findings,
          outcome,
          recommendations,
          context,
        );
        res.json(investigation);
      } catch (error) {
        next(error);
      }
    },

    // ============================================================================
    // Corrective Action Endpoints
    // ============================================================================

    /**
     * POST /api/corrective-actions
     * Create a new corrective action
     */
    async createCorrectiveAction(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const action = await service.createCorrectiveAction(req.body, context);
        res.status(201).json(action);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /api/corrective-actions/:id/progress
     * Update corrective action progress
     */
    async updateActionProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const { progress, notes } = req.body;
        const action = await service.updateCorrectiveActionProgress(
          req.params.id,
          progress,
          notes,
          context,
        );
        res.json(action);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/corrective-actions/:id/verify
     * Verify corrective action effectiveness
     */
    async verifyAction(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const { effectivenessRating, verificationNotes } = req.body;
        const action = await service.verifyCorrectiveAction(
          req.params.id,
          effectivenessRating,
          verificationNotes,
          context,
        );
        res.json(action);
      } catch (error) {
        next(error);
      }
    },

    // ============================================================================
    // Regulatory Reporting Endpoints
    // ============================================================================

    /**
     * POST /api/regulatory-reports
     * Submit a regulatory report
     */
    async submitRegulatoryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const report = await service.submitRegulatoryReport(req.body, context);
        res.status(201).json(report);
      } catch (error) {
        next(error);
      }
    },

    // ============================================================================
    // Analytics & Dashboard Endpoints
    // ============================================================================

    /**
     * GET /api/risk-dashboard
     * Get risk dashboard for organization
     */
    async getRiskDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const context: UserContext = (req as any).userContext;
        const { organizationId, branchId } = req.query;
        const dashboard = await service.getRiskDashboard(
          organizationId as string,
          branchId as string | undefined,
          context,
        );
        res.json(dashboard);
      } catch (error) {
        next(error);
      }
    },
  };
}

/**
 * Create Express router with all incident and risk reporting routes
 */
export function createIncidentRiskRouter(service: IncidentRiskService) {
  // This would typically use Express Router
  // For now, just return the handlers
  return createIncidentRiskHandlers(service);
}
